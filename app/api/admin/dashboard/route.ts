import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';

// GET /api/admin/dashboard - Dashboard stats (admin only)
export async function GET() {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();

        // Every query below is independent, so they run together. They used
        // to be awaited one after another — nine sequential round-trips to
        // Postgres, each waiting on the last, which is most of what made
        // this screen slow to appear.
        const [
            totalsRes,
            recentOrdersRes,
            lowStockRes,
            pendingQueriesRes,
            unreadNotificationsRes,
            totalProductsRes,
            activeProductsRes,
        ] = await Promise.all([
            // Order counts and revenue as one aggregated row, computed in
            // Postgres. The previous code selected EVERY order row and summed
            // them in JavaScript, so the dashboard got steadily slower with
            // each order placed. Errors if perf-admin-indexes.sql has not been
            // applied yet — resolveOrderTotals() below handles that case.
            createSupabaseAdmin()
                .rpc('admin_dashboard_totals')
                .maybeSingle(),

            supabase.from('orders')
                .select('id, order_number, total, status, created_at, user:profiles(full_name, email)')
                .order('created_at', { ascending: false })
                .limit(5),

            supabase.from('products')
                .select('id, name, slug, stock_remaining, low_stock_threshold')
                .filter('stock_remaining', 'lte', 'low_stock_threshold')
                .eq('is_active', true)
                .order('stock_remaining')
                .limit(10),

            supabase.from('customisation_queries').select('id', { count: 'exact', head: true })
                .in('status', ['new', 'in_progress']),

            supabase.from('notifications').select('id', { count: 'exact', head: true })
                .eq('is_read', false),

            supabase.from('products').select('id', { count: 'exact', head: true }),

            supabase.from('products').select('id', { count: 'exact', head: true })
                .eq('is_active', true),
        ]);

        const orderTotals = await resolveOrderTotals(supabase, totalsRes);

        const { totalOrders, totalRevenue, pendingOrders, todayOrders, todayRevenue } = orderTotals;
        const recentOrders = recentOrdersRes.data;
        const lowStockProducts = lowStockRes.data;
        const pendingQueriesCount = pendingQueriesRes.count;
        const unreadNotificationsCount = unreadNotificationsRes.count;
        const totalProducts = totalProductsRes.count;
        const activeProducts = activeProductsRes.count;

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

interface OrderTotals {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    todayOrders: number;
    todayRevenue: number;
}

/**
 * Uses the admin_dashboard_totals() aggregate when it exists, and only
 * falls back to counting in the API when it does not — so a database
 * that has had perf-admin-indexes.sql applied pays for one round-trip,
 * and one that has not still returns correct numbers.
 */
async function resolveOrderTotals(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    totalsRes: { data: unknown; error: unknown }
): Promise<OrderTotals> {
    if (!totalsRes.error && totalsRes.data) {
        const agg = totalsRes.data as Record<string, number | string>;
        return {
            totalOrders: Number(agg.total_orders) || 0,
            totalRevenue: Number(agg.total_revenue) || 0,
            pendingOrders: Number(agg.pending_orders) || 0,
            todayOrders: Number(agg.today_orders) || 0,
            todayRevenue: Number(agg.today_revenue) || 0,
        };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayISO = startOfToday.toISOString();

    const [allCount, pendingCount, todayCount, allRevenue, todayRevenueRows] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfTodayISO),
        supabase.from('orders').select('total'),
        supabase.from('orders').select('total').gte('created_at', startOfTodayISO),
    ]);

    const sum = (rows: { total: number | string }[] | null) =>
        rows?.reduce((acc, row) => acc + Number(row.total), 0) || 0;

    return {
        totalOrders: allCount.count || 0,
        totalRevenue: sum(allRevenue.data),
        pendingOrders: pendingCount.count || 0,
        todayOrders: todayCount.count || 0,
        todayRevenue: sum(todayRevenueRows.data),
    };
}
