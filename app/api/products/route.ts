import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin, isAdmin } from '@/lib/supabase/server';

// GET /api/products - List all products (public)
export async function GET(request: NextRequest) {
    try {
        let supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        let admin = false;

        // Check admin status - gracefully handle if service role key is missing
        try {
            admin = await isAdmin();
            // Only use admin client if service role key is available
            if (admin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                console.log("Admin requesting products: Switching to Service Role Client");
                const { createSupabaseAdmin } = await import('@/lib/supabase/server');
                supabase = createSupabaseAdmin();
            }
        } catch {
            // If admin check fails, continue as non-admin
            admin = false;
        }

        // Query parameters
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const sortBy = searchParams.get('sort') || 'created_at';
        const order = searchParams.get('order') === 'asc' ? true : false;

        let query = supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name, slug),
                images:product_images(id, image_url, display_order),
                sizes:product_sizes(id, size, stock_count)
            `, { count: 'exact' });

        // For non-admins, force active only
        if (!admin) {
            query = query.eq('is_active', true);
        }

        // Filter by category
        if (category) {
            const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', category)
                .single();

            if (cat) {
                query = query.eq('category_id', cat.id);
            }
        }

        // Search by name
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        query = query.order(sortBy, { ascending: order })
            .range(offset, offset + limit - 1);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Products fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Fetch success: ${products?.length} products found. (Admin: ${admin})`);

        return NextResponse.json({
            products: products || [],
            pagination: {
                limit,
                offset,
                total: count || 0
            }
        });
    } catch (error) {
        console.error('Products API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/products - Create product (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        console.log("Starting Product Creation...");

        // Parse Body
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
            stock_total = 0,
            stock_remaining = 0,
            low_stock_threshold = 5,
            is_active = true,
            is_new = false,
            is_best_seller = false,
            sizes = []
        } = body;

        // Validation
        if (!slug || !name || !price) {
            console.error("Missing required fields:", { slug, name, price });
            return NextResponse.json(
                { error: 'Missing required fields: slug, name, price' },
                { status: 400 }
            );
        }

        // Use Service Role Client for INSERT to bypass RLS
        const { createSupabaseAdmin } = await import('@/lib/supabase/server');
        const supabaseAdmin = createSupabaseAdmin();

        console.log("Inserting product into DB...", { slug, name, is_active });

        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .insert({
                slug,
                name,
                description,
                category_id, // Ensure this is UUID or null
                price,
                discount_price,
                discount_type,
                discount_value,
                stock_total,
                stock_remaining,
                low_stock_threshold,
                is_active,
                is_new,
                is_best_seller
            })
            .select()
            .single();

        if (productError) {
            console.error('Product creation error (Supabase):', productError);
            return NextResponse.json({ error: `Database Error: ${productError.message}` }, { status: 500 });
        }

        console.log("Product inserted successfully:", product.id);

        // Create sizes if provided
        if (sizes.length > 0) {
            const sizeRecords = sizes.map((s: { size: string; stock_count: number }) => ({
                product_id: product.id,
                size: s.size,
                stock_count: s.stock_count || 0
            }));

            const { error: sizesError } = await supabaseAdmin
                .from('product_sizes')
                .insert(sizeRecords);

            if (sizesError) {
                console.error('Sizes creation error:', sizesError);
                // We don't fail the whole request but we log it
            }
        }

        // Fetch complete product with relations for immediate return
        const { data: fullProduct, error: fetchError } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                category:categories(*),
                images:product_images(*),
                sizes:product_sizes(*)
            `)
            .eq('id', product.id)
            .single();

        if (fetchError) {
            console.error("Error fetching created product:", fetchError);
        }

        return NextResponse.json({ product: fullProduct || product }, { status: 201 });

    } catch (error: any) {
        if (error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Products API error (Unknown):', error);
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
