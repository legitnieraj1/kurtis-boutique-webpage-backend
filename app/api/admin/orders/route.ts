import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';

// GET /api/admin/orders - List all orders with filters (admin only)
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        // Use admin client so RLS never filters out guest/anonymous orders
        const supabase = createSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const search = searchParams.get('search');

        let query = supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        user:profiles(id, email, full_name, phone)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`order_number.ilike.%${search}%,shipping_name.ilike.%${search}%`);
        }

        const { data: orders, error, count } = await query;

        if (error) {
            console.error('Admin orders fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const transformedOrders = orders?.map(order => {
            const customerEmail = order.customer_email || 
                (/@checkout\./i.test(order.user?.email || '') ? '' : order.user?.email) || '';
            return {
                id: order.id,
                orderNumber: order.order_number,
                status: order.status,
                total: order.total,
                subtotal: order.subtotal,
                shippingCost: order.shipping_cost,
                discountAmount: order.discount_amount,
                createdAt: order.created_at,
                date: new Date(order.created_at).toLocaleDateString('en-IN'),
                customer: {
                    name: order.shipping_name || order.user?.full_name || 'Unknown',
                    email: customerEmail,
                    phone: order.shipping_phone || order.user?.phone || '',
                },
                shippingAddress: {
                    name: order.shipping_name,
                    phone: order.shipping_phone,
                    line1: order.shipping_address_line1,
                    line2: order.shipping_address_line2,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    pincode: order.shipping_pincode,
                },
                items: order.items || [],
                tracking: {
                    awb: order.awb_id,
                    shipmentId: order.shipment_id,
                    courier: order.courier_name,
                    trackingUrl: order.tracking_url,
                },
                razorpayOrderId: order.razorpay_order_id,
                confirmationEmailSentAt: order.confirmation_email_sent_at,
            };
        }) || [];

        return NextResponse.json({
            orders: transformedOrders,
            rawOrders: orders,
            pagination: { limit, offset, total: count }
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin orders API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
