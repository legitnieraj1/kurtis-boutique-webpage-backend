import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/** UUID v4 check */
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

export async function POST(request: NextRequest) {
    const rawBody = await request.text();

    // ── 1. Verify Razorpay webhook signature ────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not set');
        // Still return 200 so Razorpay doesn't keep retrying before secret is configured
        return NextResponse.json({ ok: true });
    }

    const razorpaySignature = request.headers.get('x-razorpay-signature') || '';
    const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSig !== razorpaySignature) {
        console.error('[Webhook] ❌ Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ── 2. Parse event ──────────────────────────────────────────────────
    let event: any;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType: string = event.event || '';
    console.log(`[Webhook] Event received: ${eventType}`);

    // Only handle payment.captured and payment.authorized
    if (!['payment.captured', 'payment.authorized'].includes(eventType)) {
        return NextResponse.json({ ok: true, skipped: true });
    }

    const payment = event.payload?.payment?.entity;
    if (!payment) {
        return NextResponse.json({ ok: true, skipped: 'no payment entity' });
    }

    const razorpayOrderId: string = payment.order_id;
    const razorpayPaymentId: string = payment.id;

    if (!razorpayOrderId) {
        console.error('[Webhook] No order_id in payment entity');
        return NextResponse.json({ ok: true, skipped: 'no order_id' });
    }

    const adminDb = createSupabaseAdmin();

    // ── 3. Idempotency — if order already exists, we're done ────────────
    const { data: existingOrder } = await adminDb
        .from('orders')
        .select('id, order_number')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

    if (existingOrder) {
        console.log(`[Webhook] Order already exists for ${razorpayOrderId} — skipping`);
        return NextResponse.json({ ok: true, orderId: existingOrder.id, duplicate: true });
    }

    // ── 4. Load checkout session ─────────────────────────────────────────
    const { data: session, error: sessionErr } = await adminDb
        .from('checkout_sessions')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

    if (sessionErr || !session) {
        console.error('[Webhook] ❌ checkout_session not found for', razorpayOrderId, sessionErr?.message);
        // Return 500 so Razorpay retries — covers race where session row not yet committed
        // when webhook fires. Idempotency check above prevents duplicates on successful retry.
        return NextResponse.json({ error: 'session_not_found_retry', razorpayOrderId }, { status: 500 });
    }

    const cartItems: any[] = session.cart_items || [];
    const shippingAddress: Record<string, string> = session.shipping_address || {};
    const customerEmail: string = session.customer_email || '';
    const shippingCost: number = Number(session.shipping_cost) || 0;
    const subtotal: number = Number(session.subtotal) || 0;
    const total: number = Number(session.total) || 0;

    // ── 5. Build order items ─────────────────────────────────────────────
    const orderItemsData = cartItems.map((item: any) => {
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

    // ── 6. Resolve user_id ───────────────────────────────────────────────
    let userId: string | null = (session.user_id && isValidUUID(session.user_id)) ? session.user_id : null;

    if (!userId) {
        // Create a ghost guest user
        try {
            const guestEmail = `guest-${Date.now()}-${Math.floor(Math.random() * 9999)}@checkout.kurtisboutique.in`;
            const { data } = await adminDb.auth.admin.createUser({
                email: guestEmail,
                email_confirm: true,
                user_metadata: { source: 'webhook_guest', payment_id: razorpayPaymentId },
            });
            if (data.user?.id) {
                userId = data.user.id;
                console.log('[Webhook] Created ghost guest user:', guestEmail);
            }
        } catch (err) {
            console.error('[Webhook] ❌ Could not create guest user:', err);
        }
    }

    if (!userId) {
        console.error('[Webhook] ❌ Cannot resolve user_id — aborting');
        // Return 500 so Razorpay retries; transient auth issue may resolve on retry.
        return NextResponse.json({ error: 'user_id_resolution_failed', razorpayOrderId }, { status: 500 });
    }

    // ── 7. Insert order ──────────────────────────────────────────────────
    const fallbackOrderNumber = generateOrderNumber();
    const phone10 = sanitizePhone(shippingAddress?.phone || '');

    const { data: order, error: orderError } = await adminDb
        .from('orders')
        .insert({
            user_id: userId,
            status: 'pending',
            subtotal,
            shipping_cost: shippingCost,
            discount_amount: 0,
            total,
            razorpay_order_id: razorpayOrderId,
            shipping_name: (shippingAddress?.name || '').trim(),
            shipping_phone: phone10,
            shipping_address_line1: (shippingAddress?.address || '').trim(),
            shipping_address_line2: '',
            shipping_city: (shippingAddress?.city || '').trim(),
            shipping_state: (shippingAddress?.state || '').trim(),
            shipping_pincode: (shippingAddress?.pincode || '').trim(),
            customer_email: customerEmail.trim().toLowerCase() || null,
        })
        .select()
        .single();

    if (orderError || !order) {
        // 23505 means the browser verify call won the race and already created
        // this order. That is a success, so answer 200 — a 500 here would make
        // Razorpay retry a payment that is already fully recorded.
        if (orderError?.code === '23505') {
            console.log('[Webhook] Order already created by verify:', razorpayOrderId);
            await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', razorpayOrderId);
            return NextResponse.json({ ok: true, duplicate: true, razorpayOrderId });
        }

        console.error('[Webhook] ❌ Order insert failed:', orderError?.message);
        // Return 500 so Razorpay retries; transient DB error may resolve on retry.
        return NextResponse.json({ error: 'order_insert_failed', dbError: orderError?.message, razorpayOrderId }, { status: 500 });
    }

    // ── 8. Ensure order_number ───────────────────────────────────────────
    const orderNumber: string = order.order_number || fallbackOrderNumber;
    if (!order.order_number) {
        await adminDb.from('orders').update({ order_number: orderNumber }).eq('id', order.id);
    }

    // ── 9. Insert order items ────────────────────────────────────────────
    const { error: itemsErr } = await adminDb
        .from('order_items')
        .insert(orderItemsData.map(item => ({ ...item, order_id: order.id })));
    if (itemsErr) console.error('[Webhook] ⚠️ order_items error:', itemsErr.message);

    // ── 10. Add timeline entry ───────────────────────────────────────────
    await adminDb.from('order_timeline').insert({
        order_id: order.id,
        status: 'pending',
        description: 'Order placed successfully (payment confirmed)',
    });

    // ── 11. Decrement stock (best-effort) ────────────────────────────────
    for (const item of cartItems) {
        if (!item.product_id || !isValidUUID(item.product_id)) continue;
        const { error: stockErr } = await adminDb.rpc('decrement_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
            p_size: item.size || null,
            p_color: item.color || null,
            p_combo_type: item.combo_type || 'single',
        });
        if (stockErr) console.error('[Webhook] Stock decrement error:', stockErr.message);
    }

    // ── 12. Mark session as used ─────────────────────────────────────────
    await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', razorpayOrderId);

    // ── 13. Notifications ────────────────────────────────────────────────
    // Deferred until after the response: Razorpay retries slow webhooks, and
    // an email round-trip is exactly the kind of delay that triggers one.
    after(async () => {
        try {
            const { sendOrderPlacedEmails } = await import('@/lib/orderEmails');
            await sendOrderPlacedEmails({
                orderId: order.id,
                orderNumber,
                customerEmail: customerEmail.trim() || null,
                customerName: (shippingAddress?.name || '').trim(),
                customerPhone: phone10,
                items: orderItemsData,
                subtotal,
                shippingCost,
                total,
                address: {
                    line1: (shippingAddress?.address || '').trim(),
                    line2: '',
                    city: (shippingAddress?.city || '').trim(),
                    state: (shippingAddress?.state || '').trim(),
                    pincode: (shippingAddress?.pincode || '').trim(),
                },
                paymentId: razorpayPaymentId,
                source: 'webhook',
            });
        } catch (emailErr) {
            console.error('[OrderEmail] ⚠️ webhook hook failed:', emailErr);
        }

        try {
            const { sendAdminOrderNotification } = await import('@/lib/webpush');
            const names = orderItemsData.map(i => `${i.product_name} x${i.quantity}`).join(', ');
            await sendAdminOrderNotification(orderNumber, total, names);
        } catch (pushErr) {
            console.error('[Webhook/WebPush] ⚠️:', pushErr);
        }
    });

    console.log(`[Webhook] ✅ Order created: ${orderNumber} (${order.id}) for payment ${razorpayPaymentId}`);
    return NextResponse.json({ ok: true, orderId: order.id, orderNumber });
}
