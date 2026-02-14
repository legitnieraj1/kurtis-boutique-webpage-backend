
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAuth } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();
        const { id } = await params;

        // precise verification of admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Update order status
        const { data: order, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating order:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add timeline entry
        await supabase.from('order_timeline').insert({
            order_id: id,
            status: status,
            description: `Order status updated to ${status} by admin`
        });

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('Order status update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
