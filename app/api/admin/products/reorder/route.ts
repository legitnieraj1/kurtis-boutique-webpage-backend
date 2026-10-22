import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/admin/products/reorder
 * Body: { order: Array<{ id: string; display_order: number }> }
 *
 * Saves the admin-chosen product display order to the database.
 * Used by the drag-and-drop reorder UI in /admin/products.
 */
export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();
        const { order } = await request.json() as {
            order: Array<{ id: string; display_order: number }>;
        };

        if (!Array.isArray(order) || order.length === 0) {
            return NextResponse.json({ error: 'order array is required' }, { status: 400 });
        }

        const adminDb = createSupabaseAdmin();

        // Update each product's display_order. Run as individual updates so any
        // single failure doesn't roll back the rest.
        const errors: string[] = [];
        await Promise.all(
            order.map(async ({ id, display_order }) => {
                const { error } = await adminDb
                    .from('products')
                    .update({ display_order })
                    .eq('id', id);
                if (error) errors.push(`${id}: ${error.message}`);
            })
        );

        if (errors.length > 0) {
            console.error('[Reorder] Partial failure:', errors);
            return NextResponse.json({ error: 'Some updates failed', details: errors }, { status: 500 });
        }

        // Drop the static ISR caches immediately so /shop and homepage show the
        // newly arranged order on the very next refresh.
        try {
            revalidatePath('/shop');
            revalidatePath('/');
        } catch (cacheErr) {
            console.warn('[Reorder] Cache revalidation warning:', cacheErr);
        }

        return NextResponse.json({ ok: true, updated: order.length });
    } catch (error: any) {
        console.error('[Reorder] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
