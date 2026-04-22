import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/razorpay';
import { ShiprocketService } from '@/lib/shiprocket';

interface CartItemPayload {
    product_id?: string | null;
    size: string;
    quantity: number;
    color?: string | null;
    combo_type?: string;
    baby_size?: string | null;
    unit_price: number;
    product_name: string;
    product_image?: string | null;
}

/** Generate KB{YYYYMMDD}-{4 rand} order number (fallback if DB trigger absent) */
function generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `KB${date}-${rand}`;
}

/** Sanitize phone to exactly 10 Indian digits (Shiprocket requirement) */
function sanitizePhone(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
    return digits.slice(-10);
}

/** UUID v4 regex check */
function isValidUUID(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(request: NextRequest) {
    try {
        // ── 1. Parse & validate body ────────────────────────────────────
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress,
            cartItems,
            customerEmail,
            userId: bodyUserId,
            shippingCost: clientShippingCost,
        } = body as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            orderId: string;
            shippingAddress: Record<string, string>;
            billingAddress: Record<string, string>;
            cartItems: CartItemPayload[];
            customerEmail: string;
            userId?: string;
            shippingCost?: number;
        };

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment fields', success: false }, { status: 400 });
        }

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart items missing', success: false }, { status: 400 });
        }

        // ── 2. Verify Razorpay HMAC signature ───────────────────────────
        const isValid = RazorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid payment signature', success: false }, { status: 400 });
        }

        // ── 3. Confirm payment is valid via Razorpay API ────────────────
        // Signature only proves the request came from Razorpay modal; this
        // confirms the money actually moved (guards against replayed requests).
        // Accept both 'captured' (auto-capture on) and 'authorized' (live mode
        // default when payment_capture=1 hasn't propagated yet, or older orders).
        try {
            const payment = await RazorpayService.fetchPayment(razorpay_payment_id);
            const validStatuses = ['captured', 'authorized'];
            if (!validStatuses.includes(payment.status)) {
                console.error(`[Razorpay] Payment ${razorpay_payment_id} has invalid status: ${payment.status}`);
                return NextResponse.json({ error: `Payment not completed (status: ${payment.status})`, success: false }, { status: 402 });
            }
            console.log(`[Razorpay] Payment ${razorpay_payment_id} status: ${payment.status} ✓`);
        } catch (fetchErr) {
            // Non-fatal — if Razorpay API is down we still proceed (signature was valid)
            console.warn('[Razorpay] Could not confirm payment status:', fetchErr);
        }

        const adminDb = createSupabaseAdmin();

        // ── 4. Idempotency — prevent duplicate orders ───────────────────
        // If this razorpay_order_id was already processed, return the existing order.
        const { data: existingOrder } = await adminDb
            .from('orders')
            .select('id, order_number')
            .eq('razorpay_order_id', razorpay_order_id)
            .maybeSingle();

        if (existingOrder) {
            console.log(`[Razorpay] Duplicate verify for ${razorpay_order_id} — returning existing order`);
            return NextResponse.json({
                success: true,
                orderId: existingOrder.id,
                orderNumber: existingOrder.order_number,
                paymentId: razorpay_payment_id,
                message: 'Order already created.',
            });
        }

        // ── 5. Parse shipping & validate cart items ─────────────────────
        const parsedShipping = typeof shippingAddress === 'string'
            ? JSON.parse(shippingAddress) : shippingAddress;

        let subtotal = 0;
        const orderItemsData = cartItems.map((item) => {
            const price = Math.max(0, Number(item.unit_price) || 0);
            const qty = Math.max(1, Number(item.quantity) || 1);
            const itemTotal = price * qty;
            subtotal += itemTotal;
            return {
                // Only include product_id if it's a valid UUID — avoids FK violations
                ...(item.product_id && isValidUUID(item.product_id) ? { product_id: item.product_id } : {}),
                product_name: item.product_name || 'Product',
                product_image: item.product_image || null,
                size: item.size || 'N/A',
                color: item.color || null,
                combo_type: item.combo_type || 'single',
                baby_size: item.baby_size || null,
                quantity: qty,
                unit_price: price,
                total_price: itemTotal,
            };
        });

        // ── 6. Use shipping cost from initiate (exact amount charged) ───
        // Fall back to calculation only if client didn't send it.
        let shippingCost: number = typeof clientShippingCost === 'number' ? clientShippingCost : -1;
        if (shippingCost === -1) {
            shippingCost = subtotal >= 999 ? 0 : 99;
            const pincode = parsedShipping?.pincode;
            if (pincode) {
                try {
                    const pickup = process.env.SHIPROCKET_PICKUP_POSTCODE
                        ? parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE) : 110001;
                    const sr: any = await ShiprocketService.checkServiceability({
                        pickup_postcode: pickup,
                        delivery_postcode: parseInt(pincode),
                        weight: 0.5, cod: 0,
                    });
                    if (sr.status === 200 && sr.data?.available_courier_companies?.length > 0) {
                        const sorted = [...sr.data.available_courier_companies].sort((a: any, b: any) => a.rate - b.rate);
                        shippingCost = sorted[0].rate;
                    }
                } catch { /* keep default */ }
            }
        }

        const total = subtotal + shippingCost;

        // ── 7. Resolve user_id ──────────────────────────────────────────
        // user_id is NOT NULL in orders — we MUST have a real UUID.
        // Priority: body (client session) → server cookie → signInAnonymously
        //           → admin-created guest user (nuclear fallback)
        let userId: string | null = (bodyUserId && isValidUUID(bodyUserId)) ? bodyUserId : null;

        if (!userId) {
            try {
                const anonClient = await createSupabaseServerClient();
                const { data: { user } } = await anonClient.auth.getUser();
                if (user?.id) userId = user.id;
            } catch { /* no session */ }
        }

        if (!userId) {
            try {
                const anonClient = await createSupabaseServerClient();
                const { data } = await anonClient.auth.signInAnonymously();
                if (data.user?.id) userId = data.user.id;
            } catch { /* continue */ }
        }

        // Nuclear fallback: create a ghost guest user via admin client.
        // This fires only if anonymous auth is disabled or cookies are broken.
        if (!userId) {
            try {
                const guestEmail = `guest-${Date.now()}-${Math.floor(Math.random() * 9999)}@checkout.kurtisboutique.in`;
                const { data } = await adminDb.auth.admin.createUser({
                    email: guestEmail,
                    email_confirm: true,
                    user_metadata: { source: 'guest_checkout', payment_id: razorpay_payment_id },
                });
                if (data.user?.id) {
                    userId = data.user.id;
                    console.log('[Razorpay] Created ghost guest user for order:', guestEmail);
                }
            } catch (adminUserErr) {
                console.error('[Razorpay] ❌ Could not create guest user:', adminUserErr);
            }
        }

        if (!userId) {
            // Absolute last resort: fail clearly rather than hit DB NOT NULL constraint
            console.error('[Razorpay] ❌ Cannot resolve user_id — aborting order creation. Payment:', razorpay_payment_id);
            return NextResponse.json({
                success: false,
                error: `Payment captured (${razorpay_payment_id}) but order could not be created (auth issue). Please contact support — your money is safe.`,
                paymentId: razorpay_payment_id,
            }, { status: 500 });
        }

        // ── 8. Insert order ─────────────────────────────────────────────
        const fallbackOrderNumber = generateOrderNumber();
        const phone10 = sanitizePhone(parsedShipping?.phone || '');

        const orderInsert: Record<string, any> = {
            user_id: userId,
            status: 'pending',
            subtotal,
            shipping_cost: shippingCost,
            discount_amount: 0,
            total,
            shipping_name: (parsedShipping?.name || '').trim(),
            shipping_phone: phone10,
            shipping_address_line1: (parsedShipping?.address || '').trim(),
            shipping_address_line2: '',
            shipping_city: (parsedShipping?.city || '').trim(),
            shipping_state: (parsedShipping?.state || '').trim(),
            shipping_pincode: (parsedShipping?.pincode || '').trim(),
        };

        // razorpay_order_id enables idempotency — duplicate verify calls return the existing order (step 4 above)
        orderInsert.razorpay_order_id = razorpay_order_id;

        const { data: order, error: orderError } = await adminDb
            .from('orders')
            .insert(orderInsert)
            .select()
            .single();

        if (orderError || !order) {
            const dbErrMsg = orderError?.message || 'unknown DB error';
            const dbErrDetails = orderError?.details || '';
            const dbErrHint = orderError?.hint || '';
            console.error('[Razorpay] ❌ Order insert failed:', JSON.stringify(orderError));
            console.error('[Razorpay] ❌ Insert payload (no secrets):', JSON.stringify({
                user_id: orderInsert.user_id,
                status: orderInsert.status,
                subtotal: orderInsert.subtotal,
                total: orderInsert.total,
                shipping_name: orderInsert.shipping_name,
                shipping_pincode: orderInsert.shipping_pincode,
            }));
            return NextResponse.json({
                success: false,
                error: `Payment captured (${razorpay_payment_id}) but order creation failed — ${dbErrMsg}${dbErrDetails ? ` | ${dbErrDetails}` : ''}${dbErrHint ? ` | Hint: ${dbErrHint}` : ''}. Money is safe.`,
                paymentId: razorpay_payment_id,
                dbError: dbErrMsg,
            }, { status: 500 });
        }

        // ── 9. Ensure order_number ──────────────────────────────────────
        const orderNumber: string = order.order_number || fallbackOrderNumber;
        if (!order.order_number) {
            await adminDb.from('orders').update({ order_number: orderNumber }).eq('id', order.id);
        }

        // ── 10. Insert order items ──────────────────────────────────────
        const { error: itemsErr } = await adminDb
            .from('order_items')
            .insert(orderItemsData.map(item => ({ ...item, order_id: order.id })));
        if (itemsErr) console.error('[Razorpay] ⚠️ order_items error:', itemsErr.message);

        // ── 11. Decrement stock (best-effort) ───────────────────────────
        for (const item of cartItems) {
            if (!item.product_id || !isValidUUID(item.product_id)) continue;
            const { error: stockErr } = await adminDb.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
                p_size: item.size || null,
                p_color: item.color || null,
                p_combo_type: item.combo_type || 'single',
            });
            if (stockErr) console.error('[Razorpay] Stock decrement error:', stockErr.message);
        }

        // ── 12. Push to Shiprocket ──────────────────────────────────────
        try {
            const shiprocketOrder = await ShiprocketService.createOrder({
                order_id: orderNumber,
                order_date: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8),
                pickup_location: 'warehouse',
                billing_customer_name: (parsedShipping?.name || 'Customer').split(' ')[0],
                billing_last_name: (parsedShipping?.name || '').split(' ').slice(1).join(' ') || '',
                billing_address: parsedShipping?.address || '',
                billing_address_2: '',
                billing_city: parsedShipping?.city || '',
                billing_pincode: parsedShipping?.pincode || '',
                billing_state: parsedShipping?.state || '',
                billing_country: 'India',
                billing_email: customerEmail || 'customer@kurtisboutique.in',
                billing_phone: phone10 || '9999999999',
                shipping_is_billing: true,
                order_items: orderItemsData.map(item => ({
                    name: (item.product_name + (item.size && item.size !== 'N/A' ? ` - ${item.size}` : '')).slice(0, 255),
                    sku: item.product_id || orderNumber,
                    units: item.quantity,
                    selling_price: item.unit_price,
                    discount: 0,
                    tax: 0,
                    hsn: 0,
                })),
                payment_method: 'Prepaid',
                sub_total: subtotal,
                length: 10,
                breadth: 10,
                height: 10,
                weight: 0.5,
            });

            if (shiprocketOrder?.order_id) {
                await adminDb.from('orders').update({
                    shiprocket_order_id: shiprocketOrder.order_id,   // column added in migration
                    shipment_id: shiprocketOrder.shipment_id ? String(shiprocketOrder.shipment_id) : null,
                    awb_id: shiprocketOrder.awb_code || null,          // DB column is awb_id not awb_code
                }).eq('id', order.id);
            }
        } catch (srErr) {
            console.error('[Shiprocket] ⚠️ Non-fatal error (order still created):', srErr);
        }

        // ── 13. Admin push notification ─────────────────────────────────
        try {
            const { sendAdminOrderNotification } = await import('@/lib/webpush');
            const names = orderItemsData.map(i => `${i.product_name} x${i.quantity}`).join(', ');
            await sendAdminOrderNotification(orderNumber, total, names);
        } catch (pushErr) {
            console.error('[WebPush] ⚠️ Error:', pushErr);
        }

        // ── 14. Email notification to owner ────────────────────────────
        try {
            const { sendOwnerOrderNotification } = await import('@/lib/email');
            await sendOwnerOrderNotification({
                orderNumber,
                total,
                customerName: (parsedShipping?.name || 'Customer').trim(),
                customerPhone: phone10,
                customerEmail: customerEmail || '',
                shippingAddress: [
                    parsedShipping?.address,
                    parsedShipping?.city,
                    parsedShipping?.state,
                    parsedShipping?.pincode,
                ].filter(Boolean).join(', '),
                items: orderItemsData.map(i => ({
                    name: i.product_name,
                    quantity: i.quantity,
                    price: i.unit_price,
                })),
                paymentId: razorpay_payment_id,
            });
        } catch (emailErr) {
            console.error('[Email] ⚠️ Owner notification failed (non-fatal):', emailErr);
        }

        // ── 15. Success ─────────────────────────────────────────────────
        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber,
            paymentId: razorpay_payment_id,
            message: 'Payment successful! Your order has been placed.',
        });

    } catch (error) {
        console.error('[Razorpay] ❌ Unhandled error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Verification failed',
            success: false,
        }, { status: 500 });
    }
}
