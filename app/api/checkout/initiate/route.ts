import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSupabaseServerClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/razorpay';

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
