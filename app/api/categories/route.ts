import { NextRequest, NextResponse } from 'next/server';
import { createSupabasePublic, createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';
import { fetchCategoriesWithProducts } from '@/lib/productCategories';

// GET /api/categories - List all categories with product images (public, cached 1 hour at CDN)
// `?view=list` skips the product images, for pickers that only need names.
export async function GET(request: NextRequest) {
    try {
        const supabase = createSupabasePublic();
        const listOnly = new URL(request.url).searchParams.get('view') === 'list';

        const { data: categories, error } = listOnly
            ? await supabase
                .from('categories')
                .select('id, name, slug, image_url, display_order')
                .eq('is_active', true)
                .order('display_order')
            : await fetchCategoriesWithProducts(supabase);

        if (error) {
            console.error('Categories fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ categories }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }
        });
    } catch (error) {
        console.error('Categories API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/categories - Create category (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();
        const body = await request.json();

        const { name, slug, image_url, display_order = 0, is_active = true } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Missing required fields: name, slug' },
                { status: 400 }
            );
        }

        const { data: category, error } = await supabase
            .from('categories')
            .insert({ name, slug, image_url, display_order, is_active })
            .select()
            .single();

        if (error) {
            console.error('Category creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Categories API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
