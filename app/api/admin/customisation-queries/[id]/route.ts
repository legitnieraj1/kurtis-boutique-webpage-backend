import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/customisation-queries/:id - Update query status (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { status, admin_notes } = body;

        const updateData: Record<string, unknown> = {};
        if (status !== undefined) updateData.status = status;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

        const { data: query, error } = await supabase
            .from('customisation_queries')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Query update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ query });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin query update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
