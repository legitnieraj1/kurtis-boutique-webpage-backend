import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/razorpay';
import { ShiprocketService } from '@/lib/shiprocket';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

        if (!shippingAddress?.name || !shippingAddress?.phone) {
            return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
        }

        // Calculate total from submitted cart
        let totalAmount = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

        // Calculate shipping
        let shippingCost = 0;
        const deliveryPincode = shippingAddress?.pincode;

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
                    shippingCost = totalAmount >= 999 ? 0 : 99;
                }
            } catch {
                shippingCost = totalAmount >= 999 ? 0 : 99;
            }
        } else {
            shippingCost = 99;
        }

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
