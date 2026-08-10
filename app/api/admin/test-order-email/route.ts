import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';
import { isEmailConfigured, sendEmail } from '@/lib/email';
import {
    getAdminRecipients,
    renderAdminOrderAlert,
    renderCustomerOrderConfirmation,
    sendOrderPlacedEmails,
    type OrderEmailPayload,
} from '@/lib/orderEmails';

/**
 * POST /api/admin/test-order-email  (admin only)
 *
 * Two jobs, both permanently useful:
 *   { orderId, force? }  re-send the real emails for an existing order —
 *                        what to use when a customer says they never got it.
 *   { to }               send a made-up order to one address — the loop for
 *                        working on the templates.
 *
 * Returns the raw send results so a bad key or an unverified domain shows up
 * in the response instead of only in the logs.
 */
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json().catch(() => ({}));
        const { orderId, to, force } = body as {
            orderId?: string;
            to?: string;
            force?: boolean;
        };

        if (!isEmailConfigured()) {
            return NextResponse.json(
                {
                    error: 'Email is not configured',
                    detail: 'RESEND_API_KEY and RESEND_FROM_EMAIL must both be set in this environment.',
                },
                { status: 400 }
            );
        }

        // ---- Re-send for a real order --------------------------------
        if (orderId) {
            const supabase = createSupabaseAdmin();

            const { data: order, error } = await supabase
                .from('orders')
                .select('*, items:order_items(*)')
                .eq('id', orderId)
                .single();

            if (error || !order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            const payload: OrderEmailPayload = {
                orderId: order.id,
                orderNumber: order.order_number,
                customerEmail: to || order.customer_email || null,
                customerName: order.shipping_name,
                customerPhone: order.shipping_phone,
                items: (order.items || []).map((item: any) => ({
                    product_name: item.product_name,
                    size: item.size,
                    color: item.color,
                    baby_size: item.baby_size,
                    combo_type: item.combo_type,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                })),
                subtotal: Number(order.subtotal || 0),
                shippingCost: Number(order.shipping_cost || 0),
                total: Number(order.total || 0),
                address: {
                    line1: order.shipping_address_line1,
                    line2: order.shipping_address_line2,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    pincode: order.shipping_pincode,
                },
                source: 'manual',
            };

            await sendOrderPlacedEmails(payload, { force: force === true });

            return NextResponse.json({
                sent: true,
                orderNumber: order.order_number,
                customerEmail: payload.customerEmail,
                adminRecipients: getAdminRecipients(),
                note: force
                    ? 'Claim bypassed — emails re-sent.'
                    : 'Sent only if this order had not been notified before. Pass force:true to re-send.',
            });
        }

        // ---- Fake order, for template work ---------------------------
        if (!to) {
            return NextResponse.json(
                { error: 'Pass either { orderId } to re-send a real order, or { to } for a sample.' },
                { status: 400 }
            );
        }

        const sample: OrderEmailPayload = {
            orderId: '00000000-0000-0000-0000-000000000000',
            orderNumber: 'KB-SAMPLE-0001',
            customerEmail: to,
            customerName: 'Test Customer',
            customerPhone: '9787635982',
            items: [
                {
                    product_name: 'Narayanpet Family Combo',
                    size: 'XL',
                    baby_size: '4 - 6 years',
                    combo_type: 'family',
                    quantity: 1,
                    unit_price: 1300,
                    total_price: 1300,
                },
                {
                    product_name: 'Mangalgiri cotton 3 piece salwar set',
                    size: 'M',
                    combo_type: 'single',
                    quantity: 2,
                    unit_price: 1799,
                    total_price: 3598,
                },
            ],
            subtotal: 4898,
            shippingCost: 0,
            total: 4898,
            address: {
                line1: '12 Sample Street, Near Test Landmark',
                line2: '',
                city: 'Coimbatore',
                state: 'Tamil Nadu',
                pincode: '641001',
            },
            paymentId: 'pay_sample123',
            source: 'manual',
        };

        const customer = renderCustomerOrderConfirmation(sample);
        const admin = renderAdminOrderAlert(sample);
        const admins = getAdminRecipients();

        const [customerResult, adminResult] = await Promise.all([
            sendEmail({ to, ...customer }),
            admins.length
                ? sendEmail({ to: admins, replyTo: to, ...admin })
                : Promise.resolve({ ok: false as const, reason: 'no_recipient' as const }),
        ]);

        return NextResponse.json({
            sent: true,
            customer: { to, result: customerResult },
            admin: { to: admins, result: adminResult },
        });
    } catch (error: any) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Test order email error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
