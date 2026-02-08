import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ShiprocketCheckoutService } from '@/lib/shiprocket-checkout';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-api-signature') || req.headers.get('X-Api-Signature');

        if (!signature || !ShiprocketCheckoutService.verifyWebhook(rawBody, signature as string)) {
            console.error('Invalid Checkout Webhook Signature');
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        console.log('Received Checkout Webhook:', payload);

        const { event, order_id, payment_status, shipment_status } = payload;

        // Map common checkout events
        if (event === 'order.created' || event === 'payment.success') {
            // Update Order Status
            const { error } = await supabaseAdmin
                .from('orders') // Assuming orders table exists and matches user ID
                .update({
                    status: payment_status === 'success' ? 'paid' : 'pending',
                    updated_at: new Date().toISOString(),
                    // Potentially store checkout specific metadata
                    // metadata: payload 
                })
                .eq('id', order_id); // Assuming internal ID matches

            if (error) {
                console.error('DB Update Error:', error);
                return NextResponse.json({ error: 'DB Error' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Checkout Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Processing Failed' }, { status: 500 });
    }
}
