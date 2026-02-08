import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

// GET /api/categories - List all categories with product images (public)
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: categories, error } = await supabase
            .from('categories')
            .select(`
                *,
                products:products(
                    id,
                    name,
                    product_images(image_url)
                )
            `)
            .eq('is_active', true)
            .eq('products.is_active', true)
            .order('display_order');

        if (error) {
            console.error('Categories fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Categories API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/categories - Create category (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();
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
