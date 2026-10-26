import { NextRequest, NextResponse, after } from 'next/server';
import { RazorpayService } from '@/lib/razorpay';
import { createSupabaseAdmin } from '@/lib/supabase/server';

function isValidUUID(v: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function sanitizePhone(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
    return digits.slice(-10);
}

/**
 * POST /api/razorpay/callback
 * 
 * Razorpay Standard Checkout redirects the user's browser here via an automated
 * form POST when redirect: true and callback_url are configured.
 * This is critical for mobile UPI Intent (Google Pay, PhonePe, Paytm, etc.)
 * so the UPI app returns the customer seamlessly back to Kurtis Boutique.
 */
export async function POST(request: NextRequest) {
    const baseUrl = request.nextUrl.origin || 'https://kurtisboutique.in';

    try {
        let razorpayPaymentId: string | null = null;
        let razorpayOrderId: string | null = null;
        let razorpaySignature: string | null = null;
        let errorDescription: string | null = null;

        // Try parsing multipart / form-urlencoded first
        try {
            const formData = await request.formData();
            razorpayPaymentId = formData.get('razorpay_payment_id')?.toString() || null;
            razorpayOrderId = formData.get('razorpay_order_id')?.toString() || null;
            razorpaySignature = formData.get('razorpay_signature')?.toString() || null;
            errorDescription = 
                formData.get('error[description]')?.toString() || 
                formData.get('error[reason]')?.toString() ||
                formData.get('error')?.toString() || 
                null;
        } catch {
            // Fallback to text urlencoded or JSON
            const text = await request.text();
            if (text.startsWith('{')) {
                try {
                    const json = JSON.parse(text);
                    razorpayPaymentId = json.razorpay_payment_id || null;
                    razorpayOrderId = json.razorpay_order_id || null;
                    razorpaySignature = json.razorpay_signature || null;
                    errorDescription = json.error?.description || json.error?.reason || json.error || null;
                } catch { /* ignore */ }
            } else {
                const params = new URLSearchParams(text);
                razorpayPaymentId = params.get('razorpay_payment_id');
                razorpayOrderId = params.get('razorpay_order_id');
                razorpaySignature = params.get('razorpay_signature');
                errorDescription = params.get('error[description]') || params.get('error[reason]') || params.get('error');
            }
        }

        // ── 1. Check for payment errors from Razorpay ──────────────────────────
        if (errorDescription) {
            console.warn('[Callback] ⚠️ Payment cancelled or failed by user:', errorDescription);
            return NextResponse.redirect(
                new URL(`/checkout/cancel?reason=${encodeURIComponent(errorDescription)}`, baseUrl),
                303
            );
        }

        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            console.error('[Callback] ❌ Missing required callback fields:', { razorpayPaymentId, razorpayOrderId });
            return NextResponse.redirect(
                new URL('/checkout/cancel?reason=missing_payment_parameters', baseUrl),
                303
            );
        }

        // ── 2. Verify signature ────────────────────────────────────────────────
        const isValid = RazorpayService.verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            console.error('[Callback] ❌ Payment signature mismatch for order:', razorpayOrderId);
            return NextResponse.redirect(
                new URL('/checkout/cancel?reason=signature_verification_failed', baseUrl),
                303
            );
        }

        console.log(`[Callback] ✅ Signature verified for ${razorpayOrderId} / ${razorpayPaymentId}`);

        const adminDb = createSupabaseAdmin();

        // ── 3. Check if order already exists (e.g. created by webhook or client) ─
        const { data: existingOrder } = await adminDb
            .from('orders')
            .select('id, order_number')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle();

        if (existingOrder?.order_number) {
            console.log(`[Callback] ✅ Order already created: ${existingOrder.order_number}`);
            return NextResponse.redirect(
                new URL(`/checkout/success?order_id=${encodeURIComponent(existingOrder.order_number)}`, baseUrl),
                303
            );
        }

        // ── 4. Retrieve checkout session saved at checkout initiation ─────────
        const { data: session } = await adminDb
            .from('checkout_sessions')
            .select('*')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle();

        let orderNumber = '';

        if (session) {
            const cartItems: any[] = session.cart_items || [];
            const shippingAddress: any = session.shipping_address || {};
            const customerEmail: string = session.customer_email || '';
            const shippingCost = Number(session.shipping_cost) || 0;
            const subtotal = Number(session.subtotal) || cartItems.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 1), 0);
            const total = Number(session.total) || (subtotal + shippingCost);
            const phone10 = sanitizePhone(shippingAddress?.phone || '');

            // Resolve user_id
            let userId: string | null = (session.user_id && isValidUUID(session.user_id)) ? session.user_id : null;

            if (!userId) {
                try {
                    const guestEmail = `guest-${Date.now()}-${Math.floor(Math.random() * 9999)}@checkout.kurtisboutique.in`;
                    const { data } = await adminDb.auth.admin.createUser({
                        email: guestEmail,
                        email_confirm: true,
                        user_metadata: { source: 'callback_guest', payment_id: razorpayPaymentId },
                    });
                    if (data.user?.id) userId = data.user.id;
                } catch (guestErr) {
                    console.warn('[Callback] Guest user creation error:', guestErr);
                }
            }

            if (!userId) {
                try {
                    const { data: users } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1 });
                    if (users?.users?.[0]?.id) userId = users.users[0].id;
                } catch (listErr) {
                    console.warn('[Callback] List users error:', listErr);
                }
            }

            if (!userId) {
                console.error('[Callback] ❌ Cannot resolve user_id for order:', razorpayOrderId);
                return NextResponse.redirect(
                    new URL(`/checkout/success?order_id=${encodeURIComponent(razorpayPaymentId)}`, baseUrl),
                    303
                );
            }

            // Insert into orders WITHOUT order_number — DB trigger assigns the sequential number
            const { data: order, error: orderErr } = await adminDb
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

            if (orderErr || !order) {
                if (orderErr?.code === '23505') {
                    // Webhook won the race
                    const { data: racedOrder } = await adminDb
                        .from('orders')
                        .select('id, order_number')
                        .eq('razorpay_order_id', razorpayOrderId)
                        .maybeSingle();

                    if (racedOrder?.order_number) {
                        return NextResponse.redirect(
                            new URL(`/checkout/success?order_id=${encodeURIComponent(racedOrder.order_number)}`, baseUrl),
                            303
                        );
                    }
                }
                console.error('[Callback] ❌ Order insert failed:', orderErr?.message);
                return NextResponse.redirect(
                    new URL(`/checkout/success?order_id=${encodeURIComponent(razorpayPaymentId)}`, baseUrl),
                    303
                );
            }

            orderNumber = order.order_number;

            // Insert order items
            const orderItemsData = cartItems.map((item: any) => ({
                order_id: order.id,
                ...(item.product_id && isValidUUID(item.product_id) ? { product_id: item.product_id } : {}),
                product_name: item.product_name || 'Product',
                product_image: item.product_image || null,
                size: item.size || 'N/A',
                color: item.color || null,
                combo_type: item.combo_type || 'single',
                baby_size: item.baby_size || null,
                quantity: Math.max(1, Number(item.quantity) || 1),
                unit_price: Math.max(0, Number(item.unit_price) || 0),
                total_price: (Math.max(0, Number(item.unit_price) || 0)) * (Math.max(1, Number(item.quantity) || 1)),
            }));

            await adminDb.from('order_items').insert(orderItemsData);

            // Timeline
            await adminDb.from('order_timeline').insert({
                order_id: order.id,
                status: 'pending',
                description: 'Order placed successfully (UPI/Redirect confirmation)',
            });

            // Decrement stock
            try {
                const { decrementStockForOrder } = await import('@/lib/stock');
                await decrementStockForOrder(adminDb, cartItems, orderNumber);
            } catch (stockErr) {
                console.error('[Callback] Stock decrement error:', stockErr);
            }

            // Mark session as used
            await adminDb.from('checkout_sessions').update({ used: true }).eq('razorpay_order_id', razorpayOrderId);

            // Send notification emails in background
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
                        source: 'callback',
                    });
                } catch (emailErr) {
                    console.error('[Callback] Order confirmation email failed:', emailErr);
                }
            });

        } else {
            // Edge case: checkout_session missing, but payment is genuine.
            // Fetch payment from Razorpay API and record
            try {
                const payment = (await RazorpayService.fetchPayment(razorpayPaymentId)) as any;
                const amountRupees = Math.round(Number(payment.amount || 0) / 100);
                const { data: users } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1 });
                const fallbackUserId = users?.users?.[0]?.id;

                if (fallbackUserId) {
                    const { data: placeholderOrder } = await adminDb.from('orders').insert({
                        user_id: fallbackUserId,
                        status: 'confirmed',
                        subtotal: amountRupees,
                        shipping_cost: 0,
                        discount_amount: 0,
                        total: amountRupees,
                        razorpay_order_id: razorpayOrderId,
                        shipping_name: (payment.notes?.customer_name || 'Customer').trim(),
                        shipping_phone: sanitizePhone(payment.contact || ''),
                        shipping_address_line1: 'Session missing — payment captured via UPI',
                        shipping_city: '',
                        shipping_state: '',
                        shipping_pincode: '',
                        customer_email: payment.email || null,
                    }).select().single();

                    if (placeholderOrder) {
                        orderNumber = placeholderOrder.order_number;
                    }
                }
            } catch (fallbackErr) {
                console.error('[Callback] Fallback order creation error:', fallbackErr);
            }
        }

        const finalOrderDisplay = orderNumber || razorpayOrderId;
        console.log(`[Callback] 🚀 Redirecting customer back to website: /checkout/success?order_id=${finalOrderDisplay}`);

        return NextResponse.redirect(
            new URL(`/checkout/success?order_id=${encodeURIComponent(finalOrderDisplay)}`, baseUrl),
            303
        );

    } catch (err) {
        console.error('[Callback] ❌ Unexpected error in callback route:', err);
        return NextResponse.redirect(
            new URL('/checkout/success?message=Payment+captured+successfully', baseUrl),
            303
        );
    }
}

/**
 * GET /api/razorpay/callback
 * In case user's browser performs a GET or reload on return
 */
export async function GET(request: NextRequest) {
    const baseUrl = request.nextUrl.origin || 'https://kurtisboutique.in';
    const razorpayOrderId = request.nextUrl.searchParams.get('razorpay_order_id');
    const razorpayPaymentId = request.nextUrl.searchParams.get('razorpay_payment_id');

    if (razorpayOrderId) {
        const adminDb = createSupabaseAdmin();
        const { data: order } = await adminDb
            .from('orders')
            .select('order_number')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle();

        if (order?.order_number) {
            return NextResponse.redirect(
                new URL(`/checkout/success?order_id=${encodeURIComponent(order.order_number)}`, baseUrl),
                303
            );
        }
    }

    if (razorpayPaymentId) {
        return NextResponse.redirect(
            new URL(`/checkout/success?order_id=${encodeURIComponent(razorpayPaymentId)}`, baseUrl),
            303
        );
    }

    return NextResponse.redirect(new URL('/checkout', baseUrl), 303);
}
