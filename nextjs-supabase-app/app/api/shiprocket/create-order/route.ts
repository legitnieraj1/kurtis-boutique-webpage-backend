import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ShiprocketService } from '@/lib/shiprocket';
import { ShiprocketOrderPayload } from '@/lib/shiprocket-types';

// Initialize Supabase Admin Client (to bypass RLS for updating order status if needed)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, orderData } = body;

        if (!orderId || !orderData) {
            return NextResponse.json(
                { error: 'Missing orderId or orderData' },
                { status: 400 }
            );
        }

        console.log(`Processing Shiprocket order for internal order: ${orderId}`);

        // 1. Create Order in Shiprocket
        const shiprocketOrder = await ShiprocketService.createOrder(orderData as ShiprocketOrderPayload);

        // 2. Assign AWB
        // Note: Some flows might require user selection of courier. 
        // Here we auto-assign for full automation using the default/best available.
        const awbResponse = await ShiprocketService.assignAWB({
            shipment_id: shiprocketOrder.shipment_id.toString()
        });

        // 3. Generate Pickup
        // Note: Pickup generation usually happens after packing. 
        // Creating it immediately for full automation request.
        const pickupResponse = await ShiprocketService.generatePickup({
            shipment_id: [shiprocketOrder.shipment_id.toString()]
        });

        // 4. Generate Label
        const labelResponse = await ShiprocketService.generateLabel({
            shipment_id: [shiprocketOrder.shipment_id.toString()]
        });

        // 5. Save to Database
        const { error: dbError } = await supabaseAdmin
            .from('shipments')
            .insert({
                order_id: orderId,
                shiprocket_order_id: shiprocketOrder.order_id,
                shipment_id: shiprocketOrder.shipment_id,
                awb_code: awbResponse.response.data.awb_code,
                courier_company_id: awbResponse.response.data.courier_company_id,
                courier_name: awbResponse.response.data.courier_name,
                status: 'OPEN', // Initial status
                pickup_token_number: pickupResponse.response.pickup_token_number,
                label_url: labelResponse.label_url,
                metadata: {
                    shiprocket_order: shiprocketOrder,
                    awb_response: awbResponse,
                    pickup_response: pickupResponse
                }
            });

        if (dbError) {
            console.error('Database error saving shipment:', dbError);
            return NextResponse.json({ error: 'Failed to save shipment to DB' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            shiprocket_order_id: shiprocketOrder.order_id,
            awb: awbResponse.response.data.awb_code,
            label_url: labelResponse.label_url
        });

    } catch (error: any) {
        console.error('Shiprocket Order Creation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
