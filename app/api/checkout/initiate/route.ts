import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSupabaseServerClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/razorpay';
import { ShiprocketService } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
    console.log('[Checkout] Starting Razorpay checkout initiation...');

    try {
        // 0. Validate Razorpay config first
        const configCheck = RazorpayService.validateConfig();
        if (!configCheck.valid) {
            console.error('[Checkout] ❌ Missing config:', configCheck.missing);
            return NextResponse.json({
                error: 'Razorpay configuration error',
                details: `Missing: ${configCheck.missing.join(', ')}`
            }, { status: 500 });
        }

        const user = await requireAuth();
        console.log('[Checkout] User authenticated:', user.email);

        const supabase = await createSupabaseServerClient();

        const body = await request.json();
        const { shippingAddress, billingAddress, sameAsShipping } = body;

        // 1. Fetch Cart Items with Product Details
        const { data: cartItems, error } = await supabase
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

        if (error) {
            console.error('[Checkout] ❌ Cart fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
        }

        if (!cartItems || cartItems.length === 0) {
            console.log('[Checkout] Cart is empty');
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        console.log('[Checkout] Cart items found:', cartItems.length);

        // 2. Calculate Total Amount
        let totalAmount = 0;
        const orderItems = cartItems.map((item) => {
            const price = item.product.discount_price || item.product.price;
            const itemTotal = price * item.quantity;
            totalAmount += itemTotal;

            return {
                product_id: item.product.id,
                name: item.product.name,
                size: item.size,
                quantity: item.quantity,
                price: price,
                total: itemTotal,
            };
        });

        // 2.1 Calculate Shipping (Dynamic via Shiprocket)
        let shippingCost = 0;
        const deliveryPincode = shippingAddress?.pincode;

        if (deliveryPincode) {
            try {
                // Default pickup postcode
                const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE ?
                    parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE) : 110001;

                // Check serviceability
                const serviceResponse: any = await ShiprocketService.checkServiceability({
                    pickup_postcode: pickupPostcode,
                    delivery_postcode: parseInt(deliveryPincode),
                    weight: 0.5, // Default weight, should ideally verify from product weight
                    cod: 0 // Prepaid
                });

                if (serviceResponse.status === 200 && serviceResponse.data?.available_courier_companies?.length > 0) {
                    const couriers = serviceResponse.data.available_courier_companies;
                    couriers.sort((a: any, b: any) => a.rate - b.rate);
                    shippingCost = couriers[0].rate;
                    console.log(`[Checkout] Dynamic Shipping Cost for ${deliveryPincode}: ₹${shippingCost}`);
                } else {
                    console.warn('[Checkout] Shiprocket serviceability check failed/empty, falling back');
                    // Fallback logic could go here (e.g., standard flat rate)
                    shippingCost = totalAmount >= 999 ? 0 : 99;
                }
            } catch (srError) {
                console.error('[Checkout] Shiprocket error:', srError);
                // Fallback on error
                shippingCost = totalAmount >= 999 ? 0 : 99;
            }
        } else {
            shippingCost = totalAmount >= 999 ? 0 : 99;
        }

        totalAmount += shippingCost;

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 3. Create Razorpay Order
        const razorpayOrder = await RazorpayService.createOrder({
            amount: Math.round(totalAmount * 100), // Convert to paise
            currency: 'INR',
            receipt: orderId,
            notes: {
                user_id: user.id,
                user_email: user.email || '',
            },
        });

        console.log('[Checkout] ✅ Razorpay order created:', razorpayOrder.id);

        // 4. Store pending order in database (optional - for tracking)
        const finalBillingAddress = sameAsShipping ? shippingAddress : billingAddress;

        // 5. Return Razorpay order details for frontend checkout
        return NextResponse.json({
            success: true,
            orderId: orderId,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: RazorpayService.getPublicKey(),
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            prefill: {
                name: shippingAddress?.name || user.user_metadata?.full_name || '',
                email: user.email || '',
                contact: shippingAddress?.phone || '',
            },
            notes: {
                orderId: orderId,
                shippingAddress: JSON.stringify(shippingAddress),
                billingAddress: JSON.stringify(finalBillingAddress),
            },
        });

    } catch (error) {
        console.error('[Checkout] ❌ Error:', error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
