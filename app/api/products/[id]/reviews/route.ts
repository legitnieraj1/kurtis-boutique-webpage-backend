import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/products/:id/reviews - Public reviews for product
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createSupabaseServerClient();

        // Try to find by ID or slug
        let productQuery = supabase.from('products').select('id');
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            productQuery = productQuery.eq('id', id);
        } else {
            productQuery = productQuery.eq('slug', id);
        }

        const { data: product } = await productQuery.single();

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Reviews fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate average rating
        const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            reviews,
            stats: {
                count: reviews?.length || 0,
                averageRating: Math.round(avgRating * 10) / 10
            }
        });
    } catch (error) {
        console.error('Product reviews API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
