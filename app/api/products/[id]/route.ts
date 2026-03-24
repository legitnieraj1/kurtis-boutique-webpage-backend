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
                reviews:reviews(id, rating, comment, user_id, created_at),
                mom_baby_combos(id, mom_price, baby_base_price),
                family_combos(id, mother_price, father_price, baby_base_price),
                baby_size_prices(id, size, price)
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
            sizes,
            colors,
            is_mom_baby,
            is_family_combo,
            mom_baby_combos,
            family_combos,
            baby_size_prices
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
        if (colors !== undefined) updateData.colors = colors;
        if (is_mom_baby !== undefined) updateData.is_mom_baby = is_mom_baby;
        if (is_family_combo !== undefined) updateData.is_family_combo = is_family_combo;

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

        if (mom_baby_combos !== undefined) {
            await supabase.from('mom_baby_combos').delete().eq('product_id', id);
            if (mom_baby_combos.length > 0) {
                await supabase.from('mom_baby_combos').insert(
                    mom_baby_combos.map((c: any) => ({ product_id: id, mom_price: c.mom_price, baby_base_price: c.baby_base_price }))
                );
            }
        }

        if (family_combos !== undefined) {
            await supabase.from('family_combos').delete().eq('product_id', id);
            if (family_combos.length > 0) {
                await supabase.from('family_combos').insert(
                    family_combos.map((c: any) => ({ product_id: id, mother_price: c.mother_price, father_price: c.father_price, baby_base_price: c.baby_base_price }))
                );
            }
        }

        if (baby_size_prices !== undefined) {
            await supabase.from('baby_size_prices').delete().eq('product_id', id);
            if (baby_size_prices.length > 0) {
                await supabase.from('baby_size_prices').insert(
                    baby_size_prices.map((p: any) => ({ product_id: id, size: p.size, price: p.price }))
                );
            }
        }

        // Fetch updated product
        const { data: product } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(*),
        images:product_images(*),
        sizes:product_sizes(*),
        mom_baby_combos(*),
        family_combos(*),
        baby_size_prices(*)
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
        
        // Use service role client to ensure we can delete related records
        // regardless of RLS policies which might block admin in some cases
        let supabase = await createSupabaseServerClient();
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { createSupabaseAdmin } = await import('@/lib/supabase/server');
            supabase = createSupabaseAdmin();
        }

        // 1. Manually delete related records to avoid missing ON DELETE CASCADE issues
        await supabase.from('product_sizes').delete().eq('product_id', id);
        await supabase.from('product_images').delete().eq('product_id', id);
        await supabase.from('cart_items').delete().eq('product_id', id);
        await supabase.from('mom_baby_combos').delete().eq('product_id', id);
        await supabase.from('family_combos').delete().eq('product_id', id);
        await supabase.from('baby_size_prices').delete().eq('product_id', id);
        await supabase.from('wishlist').delete().eq('product_id', id);
        await supabase.from('reviews').delete().eq('product_id', id);
        await supabase.from('order_items').delete().eq('product_id', id);

        // 2. Attempt to delete the product
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
