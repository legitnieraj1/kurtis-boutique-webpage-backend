import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/products/:id - Get single product (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createSupabaseServerClient();

        // Try to find by ID or slug
        let query = supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name, slug),
                images:product_images(id, image_url, display_order),
                sizes:product_sizes(id, size, stock_count),
                reviews:reviews(id, rating, comment, user_id, created_at)
            `);

        // Check if it's a UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            query = query.eq('id', id);
        } else {
            query = query.eq('slug', id);
        }

        const { data: product, error } = await query.single();

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error('Product fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/products/:id - Update product (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const {
            slug,
            name,
            description,
            category_id,
            price,
            discount_price,
            discount_type,
            discount_value,
            stock_total,
            stock_remaining,
            low_stock_threshold,
            is_active,
            is_new,
            is_best_seller,
            sizes
        } = body;

        // Update product
        const updateData: Record<string, unknown> = {};
        if (slug !== undefined) updateData.slug = slug;
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (category_id !== undefined) updateData.category_id = category_id;
        if (price !== undefined) updateData.price = price;
        if (discount_price !== undefined) updateData.discount_price = discount_price;
        if (discount_type !== undefined) updateData.discount_type = discount_type;
        if (discount_value !== undefined) updateData.discount_value = discount_value;
        if (stock_total !== undefined) updateData.stock_total = stock_total;
        if (stock_remaining !== undefined) updateData.stock_remaining = stock_remaining;
        if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (is_new !== undefined) updateData.is_new = is_new;
        if (is_best_seller !== undefined) updateData.is_best_seller = is_best_seller;

        const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Product update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Update sizes if provided
        if (sizes !== undefined) {
            // Delete existing sizes
            await supabase.from('product_sizes').delete().eq('product_id', id);

            // Insert new sizes
            if (sizes.length > 0) {
                const sizeRecords = sizes.map((s: { size: string; stock_count: number }) => ({
                    product_id: id,
                    size: s.size,
                    stock_count: s.stock_count || 0
                }));

                await supabase.from('product_sizes').insert(sizeRecords);
            }
        }

        // Fetch updated product
        const { data: product } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(*),
        images:product_images(*),
        sizes:product_sizes(*)
      `)
            .eq('id', id)
            .single();

        return NextResponse.json({ product });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Product update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/products/:id - Delete product (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Product delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Product delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
