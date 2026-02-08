import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAuth } from '@/lib/supabase/server';

// GET /api/cart - Get user's cart (authenticated)
export async function GET() {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();

        const { data: cartItems, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                user_id,
                product_id,
                size,
                quantity,
                created_at,
                product:products(
                    id,
                    name,
                    slug,
                    price,
                    discount_price,
                    images:product_images(id, image_url, display_order)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at');

        if (error) {
            console.error('Cart fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ cart: cartItems });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Cart API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/cart - Add item to cart (authenticated)
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();
        const { product_id, size, quantity = 1 } = await request.json();

        if (!product_id || !size) {
            return NextResponse.json(
                { error: 'Missing required fields: product_id, size' },
                { status: 400 }
            );
        }

        // Check if item already exists in cart
        const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('product_id', product_id)
            .eq('size', size)
            .single();

        if (existing) {
            // Update quantity
            const { data: updated, error } = await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ cartItem: updated });
        }

        // Create new cart item
        const { data: cartItem, error } = await supabase
            .from('cart_items')
            .insert({
                user_id: user.id,
                product_id,
                size,
                quantity
            })
            .select()
            .single();

        if (error) {
            console.error('Cart add error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ cartItem }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Cart API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/cart - Update cart item quantity (authenticated)
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();
        const { cart_item_id, quantity } = await request.json();

        if (!cart_item_id || quantity === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: cart_item_id, quantity' },
                { status: 400 }
            );
        }

        if (quantity <= 0) {
            // Delete item if quantity is 0 or negative
            await supabase
                .from('cart_items')
                .delete()
                .eq('id', cart_item_id)
                .eq('user_id', user.id);

            return NextResponse.json({ success: true, deleted: true });
        }

        const { data: updated, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cart_item_id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Cart update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ cartItem: updated });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Cart API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/cart - Remove item or clear cart (authenticated)
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const cartItemId = searchParams.get('id');
        const clearAll = searchParams.get('clear') === 'true';

        if (clearAll) {
            // Clear entire cart
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            return NextResponse.json({ success: true, cleared: true });
        }

        if (!cartItemId) {
            return NextResponse.json({ error: 'Cart item ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Cart delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Cart API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
