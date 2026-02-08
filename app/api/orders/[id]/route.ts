import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAuth, isAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/orders/:id - Get order details (owner or admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();
        const adminUser = await isAdmin();

        let query = supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        timeline:order_timeline(*)
      `)
            .eq('id', id);

        // Non-admins can only view their own orders
        if (!adminUser) {
            query = query.eq('user_id', user.id);
        }

        const { data: order, error } = await query.single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Order fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
