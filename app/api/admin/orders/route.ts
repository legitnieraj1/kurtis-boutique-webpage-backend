import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

// GET /api/admin/orders - List all orders with filters (admin only)
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const search = searchParams.get('search');

        let query = supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        user:profiles(id, email, full_name, phone)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`order_number.ilike.%${search}%,shipping_name.ilike.%${search}%`);
        }

        const { data: orders, error, count } = await query;

        if (error) {
            console.error('Admin orders fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            orders,
            pagination: { limit, offset, total: count }
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin orders API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
