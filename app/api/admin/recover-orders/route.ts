import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';
import Razorpay from 'razorpay';
import { decrementStockForOrder } from '@/lib/stock';
import { sendOrderPlacedEmails, type OrderEmailPayload } from '@/lib/orderEmails';

/** UUID check */
function isValidUUID(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Sanitize phone to exactly 10 Indian digits */
function sanitizePhone(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
    return digits.slice(-10);
}

/** Generate KB{YYYYMMDD}-{4 rand} order number */
function generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `KB${date}-${rand}`;
}

/**
 * POST /api/admin/recover-orders
 *
 * Scans Razorpay for captured payments from the last N days.
 * Cross-references checkout_sessions table to recover complete, loss-free orders
 * (including real products, customer shipping addresses, stock decrements, and email notifications).
 */
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json().catch(() => ({}));
        const days: number = body.days ?? 60;

        // ── 1. Get admin user_id to satisfy NOT NULL user_id FK ───────
        const anonClient = await createSupabaseServerClient();
        const { data: { user: adminUser } } = await anonClient.auth.getUser();
        if (!adminUser) {
            return NextResponse.json({ error: 'Admin session not found' }, { status: 401 });
        }
        const adminUserId = adminUser.id;

        // ── 2. Init Razorpay ────────────────────────────────────────────
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // ── 3. Fetch payments from Razorpay ─────────────────────────────
        const fromTs = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
        const paymentsResp = await (razorpay.payments as any).all({ from: fromTs, count: 100 });
        const payments: any[] = paymentsResp?.items ?? [];
        const captured = payments.filter((p: any) => p.status === 'captured');

        if (captured.length === 0) {
            return NextResponse.json({
                message: 'No captured payments found.',
                recovered: 0,
                debug: { totalFetched: payments.length }
            });
        }

        const adminDb = createSupabaseAdmin();

        // ── 4. Which payments to process ────────────────────────────────
        const paymentIds: string[] | undefined = body.payment_ids;
        const toProcess = paymentIds
            ? captured.filter((p: any) => paymentIds.includes(p.id))
            : captured;

        // ── 5. Existing orders for duplicate detection ──────────────────
        const { data: existingOrders } = await adminDb
            .from('orders')
            .select('id, order_number, total, razorpay_order_id, created_at');

        const recovered: any[] = [];
        const skipped: any[] = [];
        const failed: any[] = [];

        for (const payment of toProcess) {
            const amountRupees = Math.round((payment.amount / 100) * 100) / 100;
            const paymentDate = new Date(payment.created_at * 1000);

            // Deduplication Check 1: exact razorpay_order_id
            const existingByRzpId = payment.order_id
                ? existingOrders?.find((o) => o.razorpay_order_id === payment.order_id)
                : null;

            if (existingByRzpId) {
                skipped.push({ paymentId: payment.id, amount: amountRupees, reason: `Matches ${existingByRzpId.order_number} by Razorpay Order ID` });
                continue;
            }

            // Deduplication Check 2: same total ±₹10 AND within 30 min
            const dup = existingOrders?.find((o) => {
                const diff = Math.abs(Number(o.total) - amountRupees);
                const tDiff = Math.abs(new Date(o.created_at).getTime() - paymentDate.getTime());
                return diff <= 10 && tDiff <= 30 * 60 * 1000;
            });

            if (dup) {
                skipped.push({ paymentId: payment.id, amount: amountRupees, reason: `Matches ${dup.order_number}` });
                continue;
            }

            // Check if checkout_sessions contains full cart & customer address
            const { data: session } = payment.order_id
                ? await adminDb
                    .from('checkout_sessions')
                    .select('*')
                    .eq('razorpay_order_id', payment.order_id)
                    .maybeSingle()
                : { data: null };

            let orderInsertData: Record<string, any>;
            let orderItemsData: any[] = [];
            let resolvedUserId = (session?.user_id && isValidUUID(session.user_id)) ? session.user_id : adminUserId;
            let cartItemsForStock: any[] = [];
            let customerEmail = '';

            const fallbackOrderNumber = generateOrderNumber();

            if (session) {
                // High-fidelity recovery from checkout session
                const cartItems = session.cart_items || [];
                const shippingAddress = session.shipping_address || {};
                customerEmail = session.customer_email || payment.email || '';
                const shippingCost = Number(session.shipping_cost) || 0;
                const subtotal = Number(session.subtotal) || (amountRupees - shippingCost);
                const total = Number(session.total) || amountRupees;
                const phone10 = sanitizePhone(shippingAddress?.phone || payment.contact || '');

                cartItemsForStock = cartItems;

                orderInsertData = {
                    user_id: resolvedUserId,
                    status: 'confirmed',
                    subtotal,
                    shipping_cost: shippingCost,
                    discount_amount: 0,
                    total,
                    razorpay_order_id: payment.order_id,
                    shipping_name: (shippingAddress?.name || payment.notes?.customer_name || 'Customer').trim(),
                    shipping_phone: phone10,
                    shipping_address_line1: (shippingAddress?.address || '').trim(),
                    shipping_address_line2: '',
                    shipping_city: (shippingAddress?.city || '').trim(),
                    shipping_state: (shippingAddress?.state || '').trim(),
                    shipping_pincode: (shippingAddress?.pincode || '').trim(),
                    customer_email: customerEmail.trim().toLowerCase() || null,
                };

                orderItemsData = cartItems.map((item: any) => {
                    const price = Math.max(0, Number(item.unit_price) || 0);
                    const qty = Math.max(1, Number(item.quantity) || 1);
                    return {
                        ...(item.product_id && isValidUUID(item.product_id) ? { product_id: item.product_id } : {}),
                        product_name: item.product_name || 'Product',
                        product_image: item.product_image || null,
                        size: item.size || 'N/A',
                        color: item.color || null,
                        combo_type: item.combo_type || 'single',
                        baby_size: item.baby_size || null,
                        quantity: qty,
                        unit_price: price,
                        total_price: price * qty,
                    };
                });
            } else {
                // Best-effort recovery from payment object
                const rawPhone: string = payment.contact ?? '';
                const phone: string = sanitizePhone(rawPhone);
                customerEmail = payment.email ?? '';
                const name: string =
                    payment.notes?.customer_name ||
                    payment.notes?.name ||
                    (customerEmail ? customerEmail.split('@')[0] : '') ||
                    'Customer';

                orderInsertData = {
                    user_id: adminUserId,
                    status: 'confirmed',
                    subtotal: amountRupees,
                    shipping_cost: 0,
                    discount_amount: 0,
                    total: amountRupees,
                    shipping_name: name,
                    shipping_phone: phone,
                    shipping_address_line1: 'RECOVERED — contact customer for address',
                    shipping_address_line2: '',
                    shipping_city: '',
                    shipping_state: '',
                    shipping_pincode: '',
                    razorpay_order_id: payment.order_id || null,
                    customer_email: customerEmail || null,
                };

                orderItemsData = [{
                    product_name: `RECOVERED PAYMENT — ₹${amountRupees} | Contact: ${phone || customerEmail || 'unknown'} | Razorpay: ${payment.id}`,
                    size: 'N/A',
                    color: null,
                    combo_type: 'single',
                    quantity: 1,
                    unit_price: amountRupees,
                    total_price: amountRupees,
                }];
            }

            // Insert into orders
            const { data: order, error: insertErr } = await adminDb
                .from('orders')
                .insert(orderInsertData)
                .select()
                .single();

            if (insertErr || !order) {
                if (insertErr?.code === '23505') {
                    skipped.push({ paymentId: payment.id, amount: amountRupees, reason: 'Order already exists' });
                    continue;
                }
                console.error(`[Recover] ❌ Insert failed for ${payment.id}:`, JSON.stringify(insertErr));
                failed.push({
                    paymentId: payment.id,
                    amount: amountRupees,
                    error: insertErr?.message ?? 'Unknown insert error',
                });
                continue;
            }

            const orderNumber = order.order_number ?? fallbackOrderNumber;
            if (!order.order_number) {
                await adminDb.from('orders').update({ order_number: orderNumber }).eq('id', order.id);
            }

            // Insert items
            if (orderItemsData.length > 0) {
                const { error: itemErr } = await adminDb
                    .from('order_items')
                    .insert(orderItemsData.map((item) => ({ ...item, order_id: order.id })));
                if (itemErr) console.warn(`[Recover] order_items error (${orderNumber}):`, itemErr.message);
            }

            // Timeline
            await adminDb.from('order_timeline').insert({
                order_id: order.id,
                status: 'confirmed',
                description: `Recovered from Razorpay | Payment: ${payment.id} | Session: ${session ? 'checkout_sessions verified' : 'best-effort'}`,
            });

            // Decrement stock if session cart items exist
            if (cartItemsForStock.length > 0) {
                try {
                    await decrementStockForOrder(adminDb, cartItemsForStock, orderNumber);
                } catch (stockErr) {
                    console.warn(`[Recover] Stock decrement warning for ${orderNumber}:`, stockErr);
                }
            }

            // Mark session as used
            if (payment.order_id) {
                await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', payment.order_id);
            }

            // Dispatch confirmation and admin emails
            if (customerEmail || process.env.ADMIN_ORDER_EMAIL) {
                try {
                    const emailPayload: OrderEmailPayload = {
                        orderId: order.id,
                        orderNumber,
                        customerEmail: customerEmail.trim() || null,
                        customerName: order.shipping_name,
                        customerPhone: order.shipping_phone,
                        items: orderItemsData,
                        subtotal: Number(order.subtotal || 0),
                        shippingCost: Number(order.shipping_cost || 0),
                        total: Number(order.total || 0),
                        address: {
                            line1: order.shipping_address_line1,
                            line2: order.shipping_address_line2,
                            city: order.shipping_city,
                            state: order.shipping_state,
                            pincode: order.shipping_pincode,
                        },
                        paymentId: payment.id,
                        source: 'recovery',
                    };
                    await sendOrderPlacedEmails(emailPayload, { force: true });
                } catch (mailErr) {
                    console.error(`[Recover] ⚠️ Email send failed for ${orderNumber}:`, mailErr);
                }
            }

            recovered.push({
                orderNumber,
                paymentId: payment.id,
                amount: amountRupees,
                phone: order.shipping_phone,
                email: customerEmail,
                fidelity: session ? 'full' : 'placeholder',
                date: paymentDate.toLocaleDateString('en-IN'),
            });
        }

        return NextResponse.json({
            message: 'Recovery complete.',
            recovered: recovered.length,
            skipped: skipped.length,
            failed: failed.length,
            recoveredOrders: recovered,
            skippedPayments: skipped,
            failedPayments: failed,
            debug: { totalFetched: payments.length, totalCaptured: captured.length, processed: toProcess.length },
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('[Recover] Unexpected error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
