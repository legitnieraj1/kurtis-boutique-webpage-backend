import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
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

        // 1. Verify Razorpay signature
        const isValid = RazorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid payment signature', success: false }, { status: 400 });
        }

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart items missing', success: false }, { status: 400 });
        }

        // 2. Build order items from submitted cart
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

        // 3. Calculate shipping
        let shippingCost = 0;
        const parsedShipping = typeof shippingAddress === 'string'
            ? JSON.parse(shippingAddress) : shippingAddress;
        const deliveryPincode = parsedShipping?.pincode;

        if (deliveryPincode) {
            try {
                const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE
                    ? parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE) : 110001;

                const serviceResponse: any = await ShiprocketService.checkServiceability({
                    pickup_postcode: pickupPostcode,
                    delivery_postcode: parseInt(deliveryPincode),
                    weight: 0.5,
                    cod: 0
                });

                if (serviceResponse.status === 200 && serviceResponse.data?.available_courier_companies?.length > 0) {
                    const couriers = serviceResponse.data.available_courier_companies;
                    couriers.sort((a: any, b: any) => a.rate - b.rate);
                    shippingCost = couriers[0].rate;
                } else {
                    shippingCost = subtotal >= 999 ? 0 : 99;
                }
            } catch {
                shippingCost = subtotal >= 999 ? 0 : 99;
            }
        } else {
            shippingCost = subtotal >= 999 ? 0 : 99;
        }

        const total = subtotal + shippingCost;

        // 4. Try to get anonymous/logged-in user for user_id (optional)
        let userId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch { /* continue as guest */ }

        // 5. Create order in DB
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

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderInsert)
            .select()
            .single();

        if (orderError) {
            console.error('[Razorpay] Order creation error:', orderError);
            return NextResponse.json({
                success: true,
                warning: 'Payment successful but order creation failed. Please contact support.',
                paymentId: razorpay_payment_id,
            });
        }

        // 6. Insert order items
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsData.map(item => ({ ...item, order_id: order.id })));

        if (itemsError) {
            console.error('[Razorpay] Order items error:', itemsError);
        }

        // 7. Decrement stock
        for (const item of cartItems) {
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
                p_size: item.size || null,
                p_color: item.color || null,
                p_combo_type: item.combo_type || 'single'
            });
            if (stockError) console.error('[Razorpay] Stock decrement error:', stockError);
        }

        // 8. Create Shiprocket order
        try {
            const shiprocketOrder = await ShiprocketService.createOrder({
                order_id: order.order_number,
                order_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
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
                order_items: orderItemsData.map(item => ({
                    name: item.product_name + (item.size ? ` - ${item.size}` : ''),
                    sku: item.product_id,
                    units: item.quantity,
                    selling_price: item.unit_price,
                    discount: 0,
                    tax: 0,
                    hsn: 0
                })),
                payment_method: 'Prepaid',
                sub_total: subtotal,
                length: 10,
                breadth: 10,
                height: 10,
                weight: 0.5
            });

            if (shiprocketOrder.order_id) {
                await supabase
                    .from('orders')
                    .update({
                        shiprocket_order_id: shiprocketOrder.order_id,
                        shiprocket_shipment_id: shiprocketOrder.shipment_id,
                        awb_code: shiprocketOrder.awb_code
                    })
                    .eq('id', order.id);
            }
        } catch (srError) {
            console.error('[Shiprocket] Error:', srError);
        }

        // 9. Push notification to admin
        try {
            const { sendAdminOrderNotification } = await import('@/lib/webpush');
            const productNames = orderItemsData.map(i => `${i.product_name} x${i.quantity}`).join(', ');
            await sendAdminOrderNotification(order.order_number, total, productNames);
        } catch (pushErr) {
            console.error('[WebPush] Error:', pushErr);
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.order_number,
            paymentId: razorpay_payment_id,
            message: 'Payment successful! Your order has been placed.',
        });

    } catch (error) {
        console.error('[Razorpay] Verification Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Verification failed', success: false },
            { status: 500 }
        );
    }
}
