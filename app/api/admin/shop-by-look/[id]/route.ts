import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';
import { LOOK_FIELDS } from '@/lib/shopByLook';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/shop-by-look/:id - Update a look (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin();

        const body = await request.json();
        const updateData: Record<string, unknown> = {};

        for (const key of ['title', 'description', 'instagram_url', 'video_url', 'thumbnail_url'] as const) {
            if (body[key] !== undefined) updateData[key] = body[key] || null;
        }
        if (body.product_id !== undefined) updateData.product_id = body.product_id;
        if (body.display_order !== undefined) updateData.display_order = body.display_order;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const { data: look, error } = await supabase
            .from('shop_by_look')
            .update(updateData)
            .eq('id', id)
            .select(LOOK_FIELDS)
            .single();

        if (error) {
            console.error('Look update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Push the change straight to the cached homepage / look pages.
        revalidatePath('/');
        revalidatePath('/look/[id]', 'page');

        return NextResponse.json({ look });
    } catch (error: any) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin shop-by-look API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/shop-by-look/:id - Remove a look (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin();

        const { error } = await supabase.from('shop_by_look').delete().eq('id', id);

        if (error) {
            console.error('Look delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidatePath('/');
        revalidatePath('/look/[id]', 'page');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin shop-by-look API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
