import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAuth } from '@/lib/supabase/server';

// GET /api/orders - List orders (user's own or all for admin)
export async function GET() {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, email, full_name, phone')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';

        // Build query - admin sees all, user sees their own
        let query = supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*),
                timeline:order_timeline(*),
                profile:profiles!user_id(email, full_name, phone)
            `)
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data: orders, error } = await query;

        if (error) {
            console.error('Orders fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform for frontend compatibility
        const transformedOrders = orders?.map(order => ({
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            total: order.total,
            subtotal: order.subtotal,
            shippingCost: order.shipping_cost,
            discountAmount: order.discount_amount,
            createdAt: order.created_at,
            date: new Date(order.created_at).toLocaleDateString('en-IN'),
            // Customer info (for admin view)
            customer: {
                name: order.shipping_name || order.profile?.full_name || 'Unknown',
                email: order.profile?.email || '',
                phone: order.shipping_phone || order.profile?.phone || '',
            },
            // Address
            shippingAddress: {
                name: order.shipping_name,
                phone: order.shipping_phone,
                line1: order.shipping_address_line1,
                line2: order.shipping_address_line2,
                city: order.shipping_city,
                state: order.shipping_state,
                pincode: order.shipping_pincode,
            },
            // Items
            items: order.items || [],
            timeline: order.timeline || [],
            // Tracking
            tracking: {
                awb: order.awb_id,
                shipmentId: order.shipment_id,
                courier: order.courier_name,
                trackingUrl: order.tracking_url,
                shiprocketOrderId: order.shiprocket_order_id, // Added for invoice download
            },
        })) || [];

        return NextResponse.json({ orders: transformedOrders, isAdmin });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Orders API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/orders - Create order (authenticated)
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { items, shipping } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        if (!shipping) {
            return NextResponse.json({ error: 'Shipping address required' }, { status: 400 });
        }

        // Calculate totals and validate stock
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const { data: product } = await supabase
                .from('products')
                .select('*, images:product_images(*)')
                .eq('id', item.product_id)
                .single();

            if (!product) {
                return NextResponse.json(
                    { error: `Product not found: ${item.product_id}` },
                    { status: 400 }
                );
            }

            if (product.stock_remaining < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${product.name}` },
                    { status: 400 }
                );
            }

            const unitPrice = product.discount_price || product.price;
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;

            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                product_image: product.images?.[0]?.image_url || null,
                size: item.size,
                quantity: item.quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }

        // Create order
        const shippingCost = subtotal >= 999 ? 0 : 99; // Free shipping above ₹999
        const total = subtotal + shippingCost;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                status: 'pending',
                subtotal,
                shipping_cost: shippingCost,
                total,
                shipping_name: shipping.name,
                shipping_phone: shipping.phone,
                shipping_address_line1: shipping.address_line1,
                shipping_address_line2: shipping.address_line2,
                shipping_city: shipping.city,
                shipping_state: shipping.state,
                shipping_pincode: shipping.pincode
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // Create order items
        const itemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);

        if (itemsError) {
            console.error('Order items error:', itemsError);
        }

        // Decrease stock
        for (const item of items) {
            await supabase.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity
            });
        }

        // Add initial timeline entry
        await supabase.from('order_timeline').insert({
            order_id: order.id,
            status: 'pending',
            description: 'Order placed successfully'
        });

        // Clear user's cart
        await supabase.from('cart_items').delete().eq('user_id', user.id);

        // Fetch complete order
        const { data: fullOrder } = await supabase
            .from('orders')
            .select(`*, items:order_items(*), timeline:order_timeline(*)`)
            .eq('id', order.id)
            .single();

        return NextResponse.json({ order: fullOrder }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Orders API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
