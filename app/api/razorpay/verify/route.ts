import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSupabaseServerClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/razorpay';
import { ShiprocketService } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
    console.log('[Razorpay] Verifying payment...');

    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
            shippingAddress,
            billingAddress,
        } = body;

        // 1. Verify payment signature
        const isValid = RazorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            console.error('[Razorpay] ❌ Invalid payment signature');
            return NextResponse.json(
                { error: 'Invalid payment signature', success: false },
                { status: 400 }
            );
        }

        console.log('[Razorpay] ✅ Payment verified:', razorpay_payment_id);

        // 2. Fetch cart items for order creation
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
                *,
                product:products (
                    id,
                    name,
                    slug,
                    price,
                    discount_price,
                    images:product_images(image_url)
                )
            `)
            .eq('user_id', user.id);

        if (cartError || !cartItems || cartItems.length === 0) {
            console.error('[Razorpay] ❌ Cart fetch error:', cartError);
            return NextResponse.json(
                { error: 'Failed to fetch cart items', success: false },
                { status: 500 }
            );
        }

        // 3. Calculate totals
        let subtotal = 0;
        const orderItemsData = cartItems.map((item) => {
            const price = item.product.discount_price || item.product.price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            return {
                product_id: item.product.id,
                product_name: item.product.name,
                product_image: item.product.images?.[0]?.image_url || null,
                size: item.size,
                quantity: item.quantity,
                unit_price: price,
                total_price: itemTotal,
            };
        });


        // 3.1 Calculate Shipping (Dynamic via Shiprocket)
        let shippingCost = 0;
        const parsedShipping = typeof shippingAddress === 'string'
            ? JSON.parse(shippingAddress)
            : shippingAddress;

        const deliveryPincode = parsedShipping?.pincode || parsedShipping?.zip;

        if (deliveryPincode) {
            try {
                // Default pickup postcode
                const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE ?
                    parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE) : 110001;

                // Check serviceability
                // We use await here, assuming verify doesn't need to be instant-instant, but it should be fast enough.
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
                    // Fallback
                    shippingCost = subtotal >= 999 ? 0 : 99;
                }
            } catch (error) {
                console.error('[Razorpay] Shipping calc error:', error);
                shippingCost = subtotal >= 999 ? 0 : 99;
            }
        } else {
            shippingCost = subtotal >= 999 ? 0 : 99;
        }

        const discountAmount = 0;
        const total = subtotal + shippingCost - discountAmount;

        // 4. Parse addresses (Already done above)

        // 5. Create order in database (matching schema columns exactly)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                status: 'confirmed',
                subtotal: subtotal,
                shipping_cost: shippingCost,
                discount_amount: discountAmount,
                total: total,
                // Shipping address fields (from schema)
                shipping_name: parsedShipping?.name || '',
                shipping_phone: parsedShipping?.phone || '',
                shipping_address_line1: parsedShipping?.address || parsedShipping?.addressLine1 || '',
                shipping_address_line2: parsedShipping?.apartment || parsedShipping?.addressLine2 || '',
                shipping_city: parsedShipping?.city || '',
                shipping_state: parsedShipping?.state || '',
                shipping_pincode: parsedShipping?.pincode || parsedShipping?.zip || '',
            })
            .select()
            .single();

        if (orderError) {
            console.error('[Razorpay] ❌ Order creation error:', orderError);
            // Payment was successful but order creation failed
            return NextResponse.json({
                success: true,
                warning: 'Payment successful but order creation failed. Please contact support.',
                paymentId: razorpay_payment_id,
            });
        }

        console.log('[Razorpay] ✅ Order created:', order.id, 'Order Number:', order.order_number);

        // 6. Insert order items
        const orderItemsToInsert = orderItemsData.map(item => ({
            ...item,
            order_id: order.id,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) {
            console.error('[Razorpay] ⚠️ Order items insert error:', itemsError);
        }

        // 7. Decrement stock for each product
        for (const item of cartItems) {
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                p_product_id: item.product.id,
                p_quantity: item.quantity
            });

            if (stockError) {
                console.error('[Razorpay] ⚠️ Stock decrement error for product:', item.product.id, stockError);
            } else {
                console.log('[Razorpay] Stock decremented for:', item.product.name, 'by', item.quantity);
            }
        }

        // 8. Clear user's cart
        const { error: clearError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        if (clearError) {
            console.warn('[Razorpay] Warning: Failed to clear cart:', clearError);
        }

        // 9. Create Shiprocket Order
        try {
            console.log('[Shiprocket] Creating order...');
            const shiprocketOrder = await ShiprocketService.createOrder({
                order_id: order.order_number,
                order_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
                pickup_location: 'warehouse', // Needs to be configured in Shiprocket
                billing_customer_name: parsedShipping?.name || 'Customer',
                billing_last_name: '',
                billing_address: parsedShipping?.address || parsedShipping?.addressLine1 || '',
                billing_address_2: parsedShipping?.apartment || parsedShipping?.addressLine2 || '',
                billing_city: parsedShipping?.city || '',
                billing_pincode: parsedShipping?.pincode || parsedShipping?.zip || '',
                billing_state: parsedShipping?.state || '',
                billing_country: 'India',
                billing_email: user.email || 'customer@example.com',
                billing_phone: parsedShipping?.phone || '9999999999',
                shipping_is_billing: true,
                order_items: orderItemsData.map(item => ({
                    name: item.product_name,
                    sku: item.product_id, // Using product_id as SKU since column is missing
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
            console.log('[Shiprocket] Order created:', shiprocketOrder);

            // Update order with Shiprocket ID if available
            if (shiprocketOrder.order_id) {
                await supabase
                    .from('orders')
                    .update({ shipment_id: String(shiprocketOrder.order_id) }) // Storing SR Order ID in shipment_id for reference
                    .eq('id', order.id);
            }

        } catch (srError) {
            console.error('[Shiprocket] ❌ Creation Error:', srError);
            // Don't fail the request, just log it. Admin can sync later.
        }

        // 10. Return success with order_number from database
        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.order_number, // This comes from the DB trigger
            paymentId: razorpay_payment_id,
            message: 'Payment successful! Your order has been placed.',
        });

    } catch (error) {
        console.error('[Razorpay] ❌ Verification Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Verification failed', success: false },
            { status: 500 }
        );
    }
}
