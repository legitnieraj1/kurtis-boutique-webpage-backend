import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketCheckoutService } from '@/lib/shiprocket-checkout';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate required fields
        if (!body.cart_items || !body.total_amount) {
            return NextResponse.json(
                { error: 'Missing required cart details' },
                { status: 400 }
            );
        }

        // Generate specific internal order ID if not provided
        const orderId = body.order_id || `ORD-${Date.now()}`;
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/orders/confirmation?order_id=${orderId}`;

        const sessionPayload = {
            order_id: orderId,
            cart_items: body.cart_items,
            sub_total: body.sub_total || body.total_amount,
            total_amount: body.total_amount,
            customer_details: body.customer_details,
            redirect_url: redirectUrl,
        };

        const session = await ShiprocketCheckoutService.createSession(sessionPayload);

        return NextResponse.json({
            success: true,
            data: session,
            // Fallback if API response structure varies
            checkout_url: session.checkout_url || session.url,
        });

    } catch (error: any) {
        console.error('Checkout Initiation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initiate checkout' },
            { status: 500 }
        );
    }
}
