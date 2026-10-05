import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin, requireAdmin } from '@/lib/supabase/server';
import { normalizeCategoryIds } from '@/lib/productCategories';

// PUT /api/admin/categories/reorder  { ids: string[] }
// Saves the order of the homepage category bubbles: position in `ids` becomes
// the category's display_order.
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();

        const ids = normalizeCategoryIds(body?.ids);
        if (ids.length === 0 || ids.length !== body.ids.length) {
            return NextResponse.json({ error: 'ids must be a list of unique category ids' }, { status: 400 });
        }

        const supabase = createSupabaseAdmin();
        const results = await Promise.all(
            ids.map((id, index) => supabase.from('categories').update({ display_order: index }).eq('id', id))
        );
        const failed = results.find(r => r.error);
        if (failed?.error) {
            console.error('Category reorder error:', failed.error);
            return NextResponse.json({ error: failed.error.message }, { status: 500 });
        }

        // Home and shop are statically cached; drop them so the new order shows.
        revalidatePath('/');
        revalidatePath('/shop');
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Category reorder error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
