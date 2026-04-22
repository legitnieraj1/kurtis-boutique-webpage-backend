import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, requireAuth, isAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/orders/:id - Get order details (owner or admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const supabase = createSupabaseAdmin();
        const adminUser = await isAdmin();

        // Build query with nested joins for items->products and user profile
        let query = supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    *,
                    product:products(
                        id,
                        name,
                        slug,
                        images:product_images(image_url)
                    )
                ),
                timeline:order_timeline(*),
                profile:profiles(full_name, email, phone)
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

        // Transform items — always prefer the stored snapshot (product_name) as it
        // contains customisation notes. Use the DB product name only as a last resort.
        const formattedOrder = {
            ...order,
            items: order.items.map((item: any) => ({
                ...item,
                product_name: item.product_name || item.product?.name || 'Unknown Product',
                image_url: item.product?.images?.[0]?.image_url || null,
                slug: item.product?.slug,
            }))
        };

        return NextResponse.json({ order: formattedOrder });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Order fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
