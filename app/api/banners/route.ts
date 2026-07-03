import { NextResponse } from 'next/server';
import { createSupabasePublic } from '@/lib/supabase/server';

// GET /api/banners - List active banners (public, cached 1 hour at CDN)
export async function GET() {
    try {
        const supabase = createSupabasePublic();

        const { data: banners, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) {
            console.error('Banners fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ banners }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }
        });
    } catch (error) {
        console.error('Banners API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
