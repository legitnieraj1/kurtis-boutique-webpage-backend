
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ShiprocketService } from '@/lib/shiprocket';
import { ShiprocketOrderPayload, ShiprocketServiceabilityResponse } from '@/lib/shiprocket-types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shippingAddress, billingAddress, sameAsShipping, paymentMethod } = body;

        if (paymentMethod !== 'COD') {
            return NextResponse.json({ error: 'Invalid payment method for this endpoint' }, { status: 400 });
        }

        // 1. Get Authenticated User
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // 2. Fetch Cart Items
        const { data: cartData, error: cartError } = await supabase
            .from('cart_items')
            .select(`
                *,
                product:products (
                    name,
                    price,
                    discount_price
                )
            `)
            .eq('user_id', user.id);

        if (cartError) {
            console.error('[COD Order] Cart fetch error:', cartError);
            return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
        }

        if (!cartData || cartData.length === 0) {
            return NextResponse.json({ error: 'Cart is empty or not found' }, { status: 400 });
        }

        const cartItems = cartData;

        // 3. Calculate Totals
        let subtotal = 0;
        let totalWeight = 0;
        const orderItems = cartItems.map((item: any) => {
            const price = item.product.discount_price || item.product.price;
            subtotal += price * item.quantity;
            totalWeight += (item.product.weight || 0.5) * item.quantity;

            return {
                name: item.product.name,
                sku: item.product_id, // Using product_id as SKU since column is missing
                units: item.quantity,
                selling_price: price,
                discount: 0,
                tax: 0,
                hsn: 6204 // Default HSN for Kurtis/Apparel
            };
        });

        // 4. Calculate Shipping & COD Charges
        const deliveryPincode = shippingAddress.pincode;
        let shippingCost = 0;
        let codCharges = 0;

        try {
            const serviceability = await ShiprocketService.checkServiceability({
                pickup_postcode: parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE || '110001'),
                delivery_postcode: parseInt(deliveryPincode),
                weight: totalWeight,
                cod: 1 // COD is true
            }) as unknown as ShiprocketServiceabilityResponse;

            if (serviceability?.data?.available_courier_companies?.length > 0) {
                const couriers = serviceability.data.available_courier_companies;
                couriers.sort((a: any, b: any) => a.rate - b.rate);
                const bestCourier = couriers[0];
                shippingCost = bestCourier.rate;
                codCharges = bestCourier.cod_charges || 0;
            } else {
                // Fallback
                shippingCost = subtotal >= 999 ? 0 : 99;
                codCharges = 0;
            }

        } catch (error) {
            console.error('Error fetching Shiprocket rates:', error);
            // Fallback logic
            shippingCost = subtotal >= 999 ? 0 : 99;
        }

        const totalAmount = subtotal + shippingCost + codCharges;

        // 5. Create Order in Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                total: totalAmount, // Schema uses 'total'
                subtotal: subtotal,
                status: 'pending',
                // payment_method: 'COD', // Removing potentially non-existent columns to be safe
                // payment_status: 'pending', 

                // Flattened Shipping Address
                shipping_name: shippingAddress.name,
                shipping_phone: shippingAddress.phone,
                shipping_address_line1: shippingAddress.address,
                shipping_city: shippingAddress.city,
                shipping_state: shippingAddress.state,
                shipping_pincode: shippingAddress.pincode,

                shipping_cost: shippingCost + codCharges,
            })
            .select()
            .single();

        if (orderError) {
            console.error('Supabase Order Creation Error:', orderError);
            throw new Error(`Failed to create order record: ${orderError.message}`);
        }

        // 6. Create Order Items in Supabase
        const orderItemsNodes = cartItems.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.discount_price || item.product.price,
            size: item.size
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsNodes);

        if (itemsError) {
            console.error('Supabase Order Items Error:', itemsError);
        }

        // 7. Create Order in Shiprocket
        const orderDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const shiprocketPayload: ShiprocketOrderPayload = {
            order_id: order.order_number, // Use the friendly order number generated by DB
            order_date: orderDate + ' ' + new Date().toLocaleTimeString('en-GB'),
            pickup_location: 'warehouse',
            billing_customer_name: billingAddress.name.split(' ')[0],
            billing_last_name: billingAddress.name.split(' ').slice(1).join(' '),
            billing_address: billingAddress.address,
            billing_city: billingAddress.city,
            billing_pincode: billingAddress.pincode,
            billing_state: billingAddress.state,
            billing_country: 'India',
            billing_email: user.email || 'guest@example.com',
            billing_phone: billingAddress.phone,
            shipping_is_billing: sameAsShipping,
            shipping_customer_name: shippingAddress.name.split(' ')[0],
            shipping_last_name: shippingAddress.name.split(' ').slice(1).join(' '),
            shipping_address: shippingAddress.address,
            shipping_city: shippingAddress.city,
            shipping_pincode: shippingAddress.pincode,
            shipping_state: shippingAddress.state,
            shipping_country: 'India',
            shipping_email: user.email || 'guest@example.com',
            shipping_phone: shippingAddress.phone,
            order_items: orderItems,
            payment_method: 'COD',
            shipping_charges: shippingCost + codCharges,
            sub_total: subtotal,
            length: 10,
            breadth: 10,
            height: 10,
            weight: totalWeight
        };

        try {
            // Initiate Shiprocket Order
            // Note: This creates the order in Shiprocket but doesn't necessarily schedule pickup yet.
            const shiprocketOrder = await ShiprocketService.createOrder(shiprocketPayload);

            // Update Supabase order with shiprocket details
            await supabase
                .from('orders')
                .update({
                    shiprocket_order_id: shiprocketOrder.order_id,
                    shiprocket_shipment_id: shiprocketOrder.shipment_id,
                    awb_code: shiprocketOrder.awb_code
                })
                .eq('id', order.id);

        } catch (srError) {
            console.error("Shiprocket creation failed:", srError);
            // We continue success response because the order IS created in our system.
            // Admin needs to handle sync later.
        }

        // 8. Clear Cart
        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.id
        });

    } catch (error: any) {
        console.error('COD Order Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
