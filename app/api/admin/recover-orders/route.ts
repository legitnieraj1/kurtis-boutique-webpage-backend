import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

/**
 * POST /api/admin/recover-orders
 *
 * Fetches captured Razorpay payments from the last N days and creates
 * DB orders for any that don't already have a matching order.
 */
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json().catch(() => ({}));
        const days: number = body.days ?? 60;

        // ── 1. Get admin user_id to satisfy the NOT NULL user_id FK ────
        const anonClient = await createSupabaseServerClient();
        const { data: { user: adminUser } } = await anonClient.auth.getUser();
        if (!adminUser) {
            return NextResponse.json({ error: 'Admin session not found' }, { status: 401 });
        }
        const adminUserId = adminUser.id;

        // ── 2. Init Razorpay ────────────────────────────────────────────
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // ── 3. Fetch payments from Razorpay ─────────────────────────────
        const fromTs = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
        const paymentsResp = await (razorpay.payments as any).all({ from: fromTs, count: 100 });
        const payments: any[] = paymentsResp?.items ?? [];
        const captured = payments.filter((p: any) => p.status === 'captured');

        if (captured.length === 0) {
            return NextResponse.json({
                message: 'No captured payments found.',
                recovered: 0,
                debug: { totalFetched: payments.length }
            });
        }

        const adminDb = createSupabaseAdmin();

        // ── 4. Which payments to process ────────────────────────────────
        const paymentIds: string[] | undefined = body.payment_ids;
        const toProcess = paymentIds
            ? captured.filter((p: any) => paymentIds.includes(p.id))
            : captured;

        // ── 5. Existing orders for duplicate detection ──────────────────
        const { data: existingOrders } = await adminDb
            .from('orders')
            .select('id, order_number, total, created_at');

        const recovered: any[] = [];
        const skipped: any[] = [];
        const failed: any[] = [];

        for (const payment of toProcess) {
            const amountRupees = Math.round((payment.amount / 100) * 100) / 100;
            const paymentDate = new Date(payment.created_at * 1000);

            // ── Duplicate: same total ±₹10 AND within 30 min ───────────
            const dup = existingOrders?.find((o) => {
                const diff = Math.abs(Number(o.total) - amountRupees);
                const tDiff = Math.abs(new Date(o.created_at).getTime() - paymentDate.getTime());
                return diff <= 10 && tDiff <= 30 * 60 * 1000;
            });

            if (dup) {
                skipped.push({ paymentId: payment.id, amount: amountRupees, reason: `Matches ${dup.order_number}` });
                continue;
            }

            // ── Extract customer info from Razorpay ─────────────────────
            const rawPhone: string = payment.contact ?? '';
            const phone: string = rawPhone.replace(/\D/g, '').replace(/^91/, ''); // strip country code
            const email: string = payment.email ?? '';
            const name: string =
                payment.notes?.customer_name ||
                payment.notes?.name ||
                (email ? email.split('@')[0] : '') ||
                'Customer';

            // ── INSERT order ─────────────────────────────────────────────
            // user_id: use admin's UUID as placeholder (column is NOT NULL)
            // order_number: NOT set — DB trigger auto-generates it
            const { data: order, error: insertErr } = await adminDb
                .from('orders')
                .insert({
                    user_id: adminUserId,          // satisfies NOT NULL constraint
                    status: 'confirmed',
                    subtotal: amountRupees,
                    shipping_cost: 0,
                    discount_amount: 0,
                    total: amountRupees,
                    shipping_name: name,
                    shipping_phone: phone,
                    shipping_address_line1: 'RECOVERED — contact customer for address',
                    shipping_address_line2: '',
                    shipping_city: '',
                    shipping_state: '',
                    shipping_pincode: '',
                })
                .select()
                .single();

            if (insertErr || !order) {
                console.error(`[Recover] ❌ Insert failed for ${payment.id}:`, JSON.stringify(insertErr));
                failed.push({
                    paymentId: payment.id,
                    amount: amountRupees,
                    error: insertErr?.message ?? 'Unknown insert error',
                    details: insertErr?.details ?? '',
                    hint: insertErr?.hint ?? '',
                });
                continue;
            }

            const orderNumber = order.order_number ?? order.id;

            // ── order_items (best-effort, skip if FK fails) ──────────────
            const { error: itemErr } = await adminDb.from('order_items').insert({
                order_id: order.id,
                product_name: `RECOVERED PAYMENT — ₹${amountRupees} | Contact: ${phone || email || 'unknown'} | Razorpay: ${payment.id}`,
                size: 'N/A',
                color: null,
                combo_type: 'single',
                quantity: 1,
                unit_price: amountRupees,
                total_price: amountRupees,
            });
            if (itemErr) console.warn(`[Recover] order_items skipped (${orderNumber}):`, itemErr.message);

            // ── order_timeline (best-effort) ─────────────────────────────
            await adminDb.from('order_timeline').insert({
                order_id: order.id,
                status: 'confirmed',
                description: `Recovered from Razorpay | Payment: ${payment.id} | Contact: ${phone || email}`,
            }).then(({ error: tlErr }) => {
                if (tlErr) console.warn(`[Recover] timeline skipped:`, tlErr.message);
            });

            recovered.push({ orderNumber, paymentId: payment.id, amount: amountRupees, phone, email, date: paymentDate.toLocaleDateString('en-IN') });
        }

        return NextResponse.json({
            message: 'Recovery complete.',
            recovered: recovered.length,
            skipped: skipped.length,
            failed: failed.length,
            recoveredOrders: recovered,
            skippedPayments: skipped,
            failedPayments: failed,
            debug: { totalFetched: payments.length, totalCaptured: captured.length, processed: toProcess.length },
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('[Recover] Unexpected error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
