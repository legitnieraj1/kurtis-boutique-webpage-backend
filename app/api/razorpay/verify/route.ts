import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/razorpay';
import { ShiprocketService } from '@/lib/shiprocket';

interface CartItemPayload {
    product_id: string;
    size: string;
    quantity: number;
    color?: string | null;
    combo_type?: string;
    baby_size?: string | null;
    unit_price: number;
    product_name: string;
    product_image?: string | null;
}

/** Generate order number in format KB{YYYYMMDD}-{4 random digits} */
function generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `KB${date}-${rand}`;
}

export async function POST(request: NextRequest) {
    try {
        // ── 1. Parse body ───────────────────────────────────────────────
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress,
            billingAddress,
            cartItems,
            customerEmail,
        } = body as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            orderId: string;
            shippingAddress: Record<string, string>;
            billingAddress: Record<string, string>;
            cartItems: CartItemPayload[];
            customerEmail: string;
        };

        // ── 2. Verify Razorpay signature ────────────────────────────────
        const isValid = RazorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid payment signature', success: false },
                { status: 400 }
            );
        }

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json(
                { error: 'Cart items missing from request', success: false },
                { status: 400 }
            );
        }

        // ── 3. Use ADMIN client for all DB writes (bypasses RLS) ────────
        const adminDb = createSupabaseAdmin();

        // ── 4. Parse shipping address ───────────────────────────────────
        const parsedShipping =
            typeof shippingAddress === 'string'
                ? JSON.parse(shippingAddress)
                : shippingAddress;

        // ── 5. Build order items + calculate subtotal ───────────────────
        let subtotal = 0;
        const orderItemsData = cartItems.map((item) => {
            const itemTotal = item.unit_price * item.quantity;
            subtotal += itemTotal;
            return {
                product_id: item.product_id,
                product_name: item.product_name,
                product_image: item.product_image || null,
                size: item.size,
                color: item.color || null,
                combo_type: item.combo_type || 'single',
                baby_size: item.baby_size || null,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: itemTotal,
            };
        });

        // ── 6. Calculate shipping cost ──────────────────────────────────
        let shippingCost = subtotal >= 999 ? 0 : 99;
        const deliveryPincode = parsedShipping?.pincode;

        if (deliveryPincode) {
            try {
                const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE
                    ? parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE)
                    : 110001;

                const serviceResponse: any = await ShiprocketService.checkServiceability({
                    pickup_postcode: pickupPostcode,
                    delivery_postcode: parseInt(deliveryPincode),
                    weight: 0.5,
                    cod: 0,
                });

                if (
                    serviceResponse.status === 200 &&
                    serviceResponse.data?.available_courier_companies?.length > 0
                ) {
                    const couriers = serviceResponse.data.available_courier_companies;
                    couriers.sort((a: any, b: any) => a.rate - b.rate);
                    shippingCost = couriers[0].rate;
                }
            } catch {
                // keep default
            }
        }

        const total = subtotal + shippingCost;

        // ── 7. Try to get logged-in / anonymous user id ─────────────────
        let userId: string | null = null;
        try {
            const anonClient = await createSupabaseServerClient();
            const {
                data: { user },
            } = await anonClient.auth.getUser();
            if (user) userId = user.id;
        } catch {
            /* guest without session cookie — that's fine */
        }

        // ── 8. Generate order number server-side ───────────────────────
        // We generate it here so the redirect URL is always correct.
        // The DB may also have a trigger; if so, the trigger value wins
        // (we'll read the returned row).
        const fallbackOrderNumber = generateOrderNumber();

        // ── 9. Insert order ─────────────────────────────────────────────
        // IMPORTANT: Only include columns that exist in the orders table schema.
        // Do NOT add new columns here without adding them to the DB first.
        const orderInsert: Record<string, any> = {
            status: 'pending',
            subtotal,
            shipping_cost: shippingCost,
            discount_amount: 0,
            total,
            shipping_name: parsedShipping?.name || '',
            shipping_phone: parsedShipping?.phone || '',
            shipping_address_line1: parsedShipping?.address || '',
            shipping_address_line2: '',
            shipping_city: parsedShipping?.city || '',
            shipping_state: parsedShipping?.state || '',
            shipping_pincode: parsedShipping?.pincode || '',
        };

        if (userId) orderInsert.user_id = userId;

        const { data: order, error: orderError } = await adminDb
            .from('orders')
            .insert(orderInsert)
            .select()
            .single();

        if (orderError || !order) {
            console.error('[Razorpay] ❌ Order creation failed:', orderError);
            // Payment was captured but order not created — still return a usable response
            // so we can show the payment_id to the customer
            return NextResponse.json({
                success: false,
                error: 'Payment successful but order creation failed. Please contact support with payment ID: ' + razorpay_payment_id,
                paymentId: razorpay_payment_id,
            }, { status: 500 });
        }

        // Use DB-generated order_number if available, else our fallback
        const orderNumber: string = order.order_number || fallbackOrderNumber;

        // If the DB didn't auto-generate order_number, write our fallback back
        if (!order.order_number) {
            await adminDb
                .from('orders')
                .update({ order_number: orderNumber })
                .eq('id', order.id);
        }

        // ── 10. Insert order items ──────────────────────────────────────
        const { error: itemsError } = await adminDb
            .from('order_items')
            .insert(orderItemsData.map((item) => ({ ...item, order_id: order.id })));

        if (itemsError) {
            console.error('[Razorpay] ⚠️ Order items insert error:', itemsError);
        }

        // ── 11. Decrement stock ─────────────────────────────────────────
        for (const item of cartItems) {
            const { error: stockError } = await adminDb.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
                p_size: item.size || null,
                p_color: item.color || null,
                p_combo_type: item.combo_type || 'single',
            });
            if (stockError) console.error('[Razorpay] Stock decrement error:', stockError);
        }

        // ── 12. Push to Shiprocket ──────────────────────────────────────
        try {
            const shiprocketOrder = await ShiprocketService.createOrder({
                order_id: orderNumber,
                order_date:
                    new Date().toISOString().split('T')[0] +
                    ' ' +
                    new Date().toTimeString().split(' ')[0],
                pickup_location: 'warehouse',
                billing_customer_name: parsedShipping?.name || 'Customer',
                billing_last_name: '',
                billing_address: parsedShipping?.address || '',
                billing_address_2: '',
                billing_city: parsedShipping?.city || '',
                billing_pincode: parsedShipping?.pincode || '',
                billing_state: parsedShipping?.state || '',
                billing_country: 'India',
                billing_email: customerEmail || 'customer@kurtisboutique.in',
                billing_phone: parsedShipping?.phone || '9999999999',
                shipping_is_billing: true,
                order_items: orderItemsData.map((item) => ({
                    name: item.product_name + (item.size ? ` - ${item.size}` : ''),
                    sku: item.product_id,
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

            if (shiprocketOrder.order_id) {
                await adminDb
                    .from('orders')
                    .update({
                        shiprocket_order_id: shiprocketOrder.order_id,
                        shiprocket_shipment_id: shiprocketOrder.shipment_id,
                        awb_code: shiprocketOrder.awb_code,
                    })
                    .eq('id', order.id);
            }
        } catch (srError) {
            console.error('[Shiprocket] ⚠️ Error:', srError);
            // Non-fatal — order is still created
        }

        // ── 13. Admin push notification ─────────────────────────────────
        try {
            const { sendAdminOrderNotification } = await import('@/lib/webpush');
            const productNames = orderItemsData
                .map((i) => `${i.product_name} x${i.quantity}`)
                .join(', ');
            await sendAdminOrderNotification(orderNumber, total, productNames);
        } catch (pushErr) {
            console.error('[WebPush] ⚠️ Error:', pushErr);
        }

        // ── 14. Return success ──────────────────────────────────────────
        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber,
            paymentId: razorpay_payment_id,
            message: 'Payment successful! Your order has been placed.',
        });
    } catch (error) {
        console.error('[Razorpay] ❌ Verification Error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Verification failed',
                success: false,
            },
            { status: 500 }
        );
    }
}
