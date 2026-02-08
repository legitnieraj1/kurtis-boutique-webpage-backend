import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/orders/:id - Get order details (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        timeline:order_timeline(*),
        user:profiles(id, email, full_name, phone)
      `)
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin order fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/orders/:id - Update order status and tracking (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const {
            status,
            awb_id,
            shipment_id,
            courier_name,
            tracking_url,
            timeline_description,
            timeline_location
        } = body;

        // Update order
        const updateData: Record<string, unknown> = {};
        if (status !== undefined) updateData.status = status;
        if (awb_id !== undefined) updateData.awb_id = awb_id;
        if (shipment_id !== undefined) updateData.shipment_id = shipment_id;
        if (courier_name !== undefined) updateData.courier_name = courier_name;
        if (tracking_url !== undefined) updateData.tracking_url = tracking_url;

        // Set timestamps based on status
        if (status === 'shipped') {
            updateData.shipped_at = new Date().toISOString();
        } else if (status === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Order update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Add timeline entry if status changed
        if (status) {
            await supabase.from('order_timeline').insert({
                order_id: id,
                status,
                description: timeline_description || `Order status changed to ${status}`,
                location: timeline_location
            });
        }

        // Fetch updated order
        const { data: order } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        timeline:order_timeline(*)
      `)
            .eq('id', id)
            .single();

        return NextResponse.json({ order });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin order update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
