import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

// GET /api/admin/dashboard - Dashboard stats (admin only)
export async function GET() {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();

        // Get order stats
        const { data: orders } = await supabase
            .from('orders')
            .select('id, total, status, created_at');

        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

        // Get recent orders (last 5)
        const { data: recentOrders } = await supabase
            .from('orders')
            .select(`
        id, order_number, total, status, created_at,
        user:profiles(full_name, email)
      `)
            .order('created_at', { ascending: false })
            .limit(5);

        // Get low stock products
        const { data: lowStockProducts } = await supabase
            .from('products')
            .select('id, name, slug, stock_remaining, low_stock_threshold')
            .filter('stock_remaining', 'lte', 'low_stock_threshold')
            .eq('is_active', true)
            .order('stock_remaining')
            .limit(10);

        // Get pending customisation queries count
        const { count: pendingQueriesCount } = await supabase
            .from('customisation_queries')
            .select('id', { count: 'exact', head: true })
            .in('status', ['new', 'in_progress']);

        // Get unread notifications count
        const { count: unreadNotificationsCount } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('is_read', false);

        // Get total products and active products
        const { count: totalProducts } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true });

        const { count: activeProducts } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);

        // Today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders?.filter(o => new Date(o.created_at) >= today).length || 0;
        const todayRevenue = orders
            ?.filter(o => new Date(o.created_at) >= today)
            .reduce((sum, o) => sum + Number(o.total), 0) || 0;

        return NextResponse.json({
            stats: {
                totalOrders,
                totalRevenue,
                pendingOrders,
                todayOrders,
                todayRevenue,
                totalProducts,
                activeProducts,
                lowStockCount: lowStockProducts?.length || 0,
                pendingQueriesCount: pendingQueriesCount || 0,
                unreadNotificationsCount: unreadNotificationsCount || 0
            },
            recentOrders,
            lowStockProducts
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
