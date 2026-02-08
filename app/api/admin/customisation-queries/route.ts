import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireAdmin } from '@/lib/supabase/server';

// GET /api/admin/customisation-queries - List all queries (admin only)
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status');

        let query = supabase
            .from('customisation_queries')
            .select(`
        *,
        user:profiles(id, email, full_name, phone),
        product:products(id, name, slug)
      `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: queries, error } = await query;

        if (error) {
            console.error('Queries fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ queries });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin queries API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
