import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/razorpay';
import { calculateShipping, DEFAULT_SHIPPING_OUTSIDE } from '@/lib/shipping';
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase/server';
import { validateIndianAddress } from '@/lib/indiaValidation';

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
        const configCheck = RazorpayService.validateConfig();
        if (!configCheck.valid) {
            return NextResponse.json({
                error: 'Razorpay configuration error',
                details: `Missing: ${configCheck.missing.join(', ')}`
            }, { status: 500 });
        }

        const body = await request.json();
        const { shippingAddress, billingAddress, sameAsShipping, cartItems, customerEmail } = body as {
            shippingAddress: Record<string, string>;
            billingAddress: Record<string, string>;
            sameAsShipping: boolean;
            cartItems: CartItemPayload[];
            customerEmail: string;
        };

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // India-only store — block non-Indian mobile numbers and PIN codes
        // before a Razorpay order exists, so no international payment can be taken.
        const shippingCheck = validateIndianAddress(shippingAddress, 'Shipping');
        if (!shippingCheck.valid) {
            return NextResponse.json({ error: shippingCheck.error }, { status: 400 });
        }

        if (sameAsShipping === false) {
            const billingCheck = validateIndianAddress(billingAddress, 'Billing');
            if (!billingCheck.valid) {
                return NextResponse.json({ error: billingCheck.error }, { status: 400 });
            }
        }

        // Calculate total from submitted cart
        let totalAmount = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

        // Flat shipping by destination pincode (TN vs outside), rates editable in admin
        const deliveryPincode = shippingAddress?.pincode;
        const shippingCost = deliveryPincode
            ? await calculateShipping(deliveryPincode)
            : DEFAULT_SHIPPING_OUTSIDE;

        totalAmount += shippingCost;

        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const razorpayOrder = await RazorpayService.createOrder({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1,  // auto-capture on live mode (prevents 'authorized' limbo)
            notes: {
                customer_email: customerEmail || '',
                customer_phone: shippingAddress?.phone || '',
            },
        });

        // ── Save session so webhook can reconstruct order without browser ──
        // This is the key to never losing an order — webhook reads this table.
        try {
            const adminDb = createSupabaseAdmin();
            const subtotalForSession = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
            await adminDb.from('checkout_sessions').upsert({
                razorpay_order_id: razorpayOrder.id,
                cart_items: cartItems,
                shipping_address: shippingAddress,
                customer_email: customerEmail || '',
                shipping_cost: shippingCost,
                subtotal: subtotalForSession,
                total: totalAmount,
            }, { onConflict: 'razorpay_order_id' });
        } catch (sessionErr) {
            // Non-fatal — verify route still works if this fails
            console.error('[Checkout] ⚠️ Could not save checkout_session:', sessionErr);
        }

        return NextResponse.json({
            success: true,
            orderId,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: RazorpayService.getPublicKey(),
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            shippingCost,          // pass to verify so it uses the exact same value
            prefill: {
                name: shippingAddress?.name || '',
                email: customerEmail || '',
                contact: shippingAddress?.phone || '',
            },
        });

    } catch (error) {
        console.error('[Checkout] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
