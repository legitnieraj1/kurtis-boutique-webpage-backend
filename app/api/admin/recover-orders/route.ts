import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

/**
 * POST /api/admin/recover-orders
 *
 * Fetches captured Razorpay payments from the last N days and creates
 * DB orders for any that don't already have a matching order.
 *
 * Body (optional): { days?: number }  — defaults to 30
 *
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json().catch(() => ({}));
        const days: number = body.days ?? 30;

        // ── 1. Init Razorpay client ─────────────────────────────────────
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // ── 2. Fetch recent payments ────────────────────────────────────
        const fromTs = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

        const paymentsResp = await razorpay.payments.all({
            from: fromTs,
            count: 100,
        }) as any;

        const payments: any[] = paymentsResp.items ?? [];

        // ── 3. Filter captured payments only ────────────────────────────
        const captured = payments.filter((p: any) => p.status === 'captured');

        if (captured.length === 0) {
            return NextResponse.json({ message: 'No captured payments found.', recovered: 0 });
        }

        const adminDb = createSupabaseAdmin();

        // ── 4. Fetch existing orders to avoid duplicates ────────────────
        // We check by shiprocket/order_number patterns. Since old orders
        // don't store razorpay_payment_id in the DB, we check by total amount
        // and created_at proximity as a heuristic, OR the admin manually
        // picks which payment IDs to recover via body.payment_ids.
        const paymentIds: string[] | undefined = body.payment_ids;

        const toRecover = paymentIds
            ? captured.filter((p: any) => paymentIds.includes(p.id))
            : captured;

        // ── 5. Get existing order numbers to detect duplicates ──────────
        const { data: existingOrders } = await adminDb
            .from('orders')
            .select('id, order_number, total, created_at')
            .order('created_at', { ascending: false });

        const recovered: string[] = [];
        const skipped: string[] = [];

        for (const payment of toRecover) {
            const amountInRupees = payment.amount / 100;
            const paymentDate = new Date(payment.created_at * 1000);

            // Check if an order already exists with same total within ±5 rupees
            // and created within 10 minutes of payment
            const duplicate = existingOrders?.find((o) => {
                const diff = Math.abs(o.total - amountInRupees);
                const timeDiff = Math.abs(
                    new Date(o.created_at).getTime() - paymentDate.getTime()
                );
                return diff <= 5 && timeDiff <= 10 * 60 * 1000;
            });

            if (duplicate) {
                skipped.push(payment.id);
                continue;
            }

            // Generate order number
            const dateStr = paymentDate
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, '');
            const rand = String(Math.floor(1000 + Math.random() * 9000));
            const orderNumber = `KB${dateStr}-${rand}`;

            // Extract customer info from Razorpay notes/email fields
            const name: string =
                payment.notes?.customer_name ||
                payment.contact ||
                'Customer';
            const phone: string =
                payment.contact?.replace(/\D/g, '') || '';
            const email: string =
                payment.email || payment.notes?.customer_email || '';

            // ── Create order in DB ──────────────────────────────────────
            const { data: order, error: orderError } = await adminDb
                .from('orders')
                .insert({
                    status: 'confirmed',
                    order_number: orderNumber,
                    subtotal: amountInRupees,
                    shipping_cost: 0,
                    discount_amount: 0,
                    total: amountInRupees,
                    shipping_name: name,
                    shipping_phone: phone,
                    shipping_address_line1: 'Recovered — address unknown',
                    shipping_address_line2: '',
                    shipping_city: '',
                    shipping_state: '',
                    shipping_pincode: '',
                    created_at: paymentDate.toISOString(),
                })
                .select()
                .single();

            if (orderError || !order) {
                console.error(`[Recover] Failed for ${payment.id}:`, orderError);
                continue;
            }

            // ── Create a placeholder order item ─────────────────────────
            await adminDb.from('order_items').insert({
                order_id: order.id,
                product_id: '00000000-0000-0000-0000-000000000000',
                product_name: 'Recovered Order — Item details unavailable',
                product_image: null,
                size: 'N/A',
                color: null,
                combo_type: 'single',
                quantity: 1,
                unit_price: amountInRupees,
                total_price: amountInRupees,
            });

            // ── Add timeline entry ──────────────────────────────────────
            await adminDb.from('order_timeline').insert({
                order_id: order.id,
                status: 'confirmed',
                description: `Recovered from Razorpay payment ${payment.id}`,
            });

            recovered.push(`${orderNumber} (payment: ${payment.id}, ₹${amountInRupees})`);
        }

        return NextResponse.json({
            message: `Recovery complete.`,
            recovered: recovered.length,
            skipped: skipped.length,
            recoveredOrders: recovered,
            skippedPayments: skipped,
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('[Recover] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
