import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';
import { buildOrdersWorkbook, type ExportOrder } from '@/lib/orderExport';

export const dynamic = 'force-dynamic';

// PostgREST caps a single response at 1000 rows, so a long date range has to
// be read page by page.
const PAGE_SIZE = 1000;
// Keeps the workbook (built in memory and returned in one response, which
// Vercel caps at 4.5 MB) bounded. Past this the export refuses rather than
// hand accounting a file that is silently missing orders.
const MAX_ORDERS = 20000;

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded'];

const ORDER_COLUMNS = `
    id, order_number, created_at, status,
    subtotal, shipping_cost, discount_amount, total,
    shipping_name, shipping_phone,
    shipping_address_line1, shipping_address_line2,
    shipping_city, shipping_state, shipping_pincode,
    awb_id, courier_name, razorpay_order_id, customer_email,
    items:order_items(product_name, size, color, combo_type, baby_size, quantity, unit_price, total_price),
    profile:profiles!user_id(email, full_name, phone)
`;

/**
 * Turns a YYYY-MM-DD picked in the admin UI into the instant that day starts
 * (or ends) in India. The server runs in UTC, so "today" cannot be taken from
 * the server clock — an order placed at 11pm IST would land on the wrong day.
 */
function istBoundary(day: string, end: boolean): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    if (!match) return null;
    const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
    // Date silently rolls 31 Feb into March; reject it instead.
    const check = new Date(Date.UTC(year, month - 1, date));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) {
        return null;
    }
    const time = end ? '23:59:59.999' : '00:00:00.000';
    return new Date(`${day}T${time}+05:30`).toISOString();
}

// GET /api/admin/orders/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=&sort=asc|desc
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const status = searchParams.get('status');
        const ascending = searchParams.get('sort') !== 'desc';

        let fromIso: string | null = null;
        let toIso: string | null = null;

        if (from) {
            fromIso = istBoundary(from, false);
            if (!fromIso) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
        }
        if (to) {
            toIso = istBoundary(to, true);
            if (!toIso) return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
        }
        if (fromIso && toIso && fromIso > toIso) {
            return NextResponse.json({ error: 'Start date must be on or before the end date' }, { status: 400 });
        }
        if (status && !STATUSES.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Service role so RLS never hides guest-checkout orders from the report.
        const supabase = createSupabaseAdmin();
        const orders: ExportOrder[] = [];

        let more = true;
        while (more) {
            if (orders.length >= MAX_ORDERS) {
                return NextResponse.json(
                    { error: `That range has more than ${MAX_ORDERS.toLocaleString('en-IN')} orders. Pick a shorter date range.` },
                    { status: 413 }
                );
            }

            let query = supabase
                .from('orders')
                .select(ORDER_COLUMNS)
                // id as tie-breaker keeps pages stable when timestamps collide.
                .order('created_at', { ascending })
                .order('id', { ascending })
                .range(orders.length, orders.length + PAGE_SIZE - 1);

            if (fromIso) query = query.gte('created_at', fromIso);
            if (toIso) query = query.lte('created_at', toIso);
            if (status) query = query.eq('status', status);

            const { data, error } = await query;
            if (error) {
                console.error('Order export fetch error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            orders.push(...((data || []) as unknown as ExportOrder[]));
            more = !!data && data.length === PAGE_SIZE;
        }

        if (orders.length === 0) {
            return NextResponse.json({ error: 'No orders found for the selected filters' }, { status: 404 });
        }

        const workbook = buildOrdersWorkbook(orders);
        const buffer = await workbook.xlsx.writeBuffer();

        const range = from || to ? `${from || 'start'}_to_${to || 'today'}` : 'all';
        const filename = `orders_${range}${status ? `_${status}` : ''}.xlsx`;

        return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
                // Lets the admin page read the real count without parsing the file.
                'X-Order-Count': String(orders.length),
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Order export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
