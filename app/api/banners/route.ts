import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/banners - List active banners (public)
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: banners, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) {
            console.error('Banners fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Banners API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
