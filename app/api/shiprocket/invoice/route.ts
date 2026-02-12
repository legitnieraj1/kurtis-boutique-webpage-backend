import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';
import { requireAuth } from '@/lib/supabase/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check - Admins only
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // 2. Call Shiprocket API to get invoice
        // Note: ShiprocketService needs a method for this, or we call generic request
        // The endpoint is usually POST /orders/print/invoice

        try {
            const response = await ShiprocketService.generateInvoice({ ids: [orderId] });

            if (response.is_invoice_created) {
                return NextResponse.json({
                    success: true,
                    invoice_url: response.invoice_url
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'Invoice generation failed or pending.'
                });
            }

        } catch (srError) {
            console.error("Shiprocket Invoice Error:", srError);
            return NextResponse.json({ error: 'Failed to fetch invoice from Shiprocket' }, { status: 500 });
        }

    } catch (error) {
        console.error('Invoice API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
