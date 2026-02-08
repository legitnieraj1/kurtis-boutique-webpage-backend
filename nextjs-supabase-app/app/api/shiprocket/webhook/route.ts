import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Shiprocket Webhook Verification (Optional but recommended: check x-shiprocket-signature if configured)
// For now, accepting payload structure directly.

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Log the webhook payload for debugging
        console.log('Shiprocket Webhook Received:', JSON.stringify(body, null, 2));

        const { awb, shipment_id, current_status, current_status_id, etd } = body;

        if (!awb) {
            // Sometimes Shiprocket sends different event types, ensure we handle safely
            return NextResponse.json({ message: 'Ignored: No AWB in payload' }, { status: 200 });
        }

        // Update 'shipments' table
        const { error } = await supabaseAdmin
            .from('shipments')
            .update({
                status: current_status,
                updated_at: new Date().toISOString(),
                metadata: {
                    webhook_latest: body
                }
            })
            .eq('awb_code', awb);

        if (error) {
            console.error('Error updating tracking status:', error);
            return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Processing Failed' }, { status: 500 });
    }
}
