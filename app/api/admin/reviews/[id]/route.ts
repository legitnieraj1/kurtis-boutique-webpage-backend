import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/reviews/:id - Update review (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const {
            reviewer_name,
            reviewer_image,
            rating,
            review_text,
            is_verified_buyer,
            is_active
        } = body;

        const updateData: Record<string, unknown> = {};
        if (reviewer_name !== undefined) updateData.reviewer_name = reviewer_name;
        if (reviewer_image !== undefined) updateData.reviewer_image = reviewer_image;
        if (rating !== undefined) updateData.rating = rating;
        if (review_text !== undefined) updateData.review_text = review_text;
        if (is_verified_buyer !== undefined) updateData.is_verified_buyer = is_verified_buyer;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data: review, error } = await supabase
            .from('reviews')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Review update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ review });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin review update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/reviews/:id - Delete review (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Review delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin review delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
