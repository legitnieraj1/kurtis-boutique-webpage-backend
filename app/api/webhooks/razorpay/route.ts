import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { ShiprocketService } from '@/lib/shiprocket';

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
        // Return 200 so Razorpay doesn't retry — we can't recover without session data
        return NextResponse.json({ ok: true, warning: 'session_not_found' });
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
        return NextResponse.json({ ok: true, warning: 'user_id_resolution_failed' });
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
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('[Webhook] ❌ Order insert failed:', orderError?.message);
        return NextResponse.json({ ok: true, warning: 'order_insert_failed', error: orderError?.message });
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

    // ── 12. Push to Shiprocket ───────────────────────────────────────────
    try {
        const shiprocketOrder = await ShiprocketService.createOrder({
            order_id: orderNumber,
            order_date: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8),
            pickup_location: 'warehouse',
            billing_customer_name: (shippingAddress?.name || 'Customer').split(' ')[0],
            billing_last_name: (shippingAddress?.name || '').split(' ').slice(1).join(' ') || '',
            billing_address: shippingAddress?.address || '',
            billing_address_2: '',
            billing_city: shippingAddress?.city || '',
            billing_pincode: shippingAddress?.pincode || '',
            billing_state: shippingAddress?.state || '',
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
                shiprocket_order_id: shiprocketOrder.order_id,
                shipment_id: shiprocketOrder.shipment_id ? String(shiprocketOrder.shipment_id) : null,
                awb_id: shiprocketOrder.awb_code || null,
            }).eq('id', order.id);
        }
    } catch (srErr) {
        console.error('[Webhook/Shiprocket] ⚠️ Non-fatal:', srErr);
    }

    // ── 13. Admin push notification ──────────────────────────────────────
    try {
        const { sendAdminOrderNotification } = await import('@/lib/webpush');
        const names = orderItemsData.map(i => `${i.product_name} x${i.quantity}`).join(', ');
        await sendAdminOrderNotification(orderNumber, total, names);
    } catch (pushErr) {
        console.error('[Webhook/WebPush] ⚠️:', pushErr);
    }

    // ── 14. Mark session as used ─────────────────────────────────────────
    await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', razorpayOrderId);

    console.log(`[Webhook] ✅ Order created: ${orderNumber} (${order.id}) for payment ${razorpayPaymentId}`);
    return NextResponse.json({ ok: true, orderId: order.id, orderNumber });
}
