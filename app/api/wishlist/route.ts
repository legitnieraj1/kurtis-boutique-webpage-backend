import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/wishlist - Get user's wishlist
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ wishlist: [] }); // Return empty for guests
        }

        const { data: wishlist, error } = await supabase
            .from('wishlist')
            .select(`
                id,
                product_id,
                created_at,
                product:products(id, name, slug, price, discount_price, is_active, images:product_images(image_url))
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Wishlist fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Extract just product_ids for easy checking
        const product_ids = wishlist?.map(item => item.product_id) || [];

        return NextResponse.json({ wishlist, product_ids });
    } catch (error) {
        console.error('Wishlist API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/wishlist - Add product to wishlist
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { product_id } = await request.json();
        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        // Check if already in wishlist
        const { data: existing } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Already in wishlist' });
        }

        const { data, error } = await supabase
            .from('wishlist')
            .insert({ user_id: user.id, product_id })
            .select()
            .single();

        if (error) {
            console.error('Wishlist add error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data }, { status: 201 });
    } catch (error) {
        console.error('Wishlist API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/wishlist - Remove product from wishlist
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const product_id = searchParams.get('product_id');

        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product_id);

        if (error) {
            console.error('Wishlist remove error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Wishlist API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
