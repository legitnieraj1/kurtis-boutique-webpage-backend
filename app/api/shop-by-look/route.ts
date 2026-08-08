import { NextResponse } from 'next/server';
import { createSupabasePublic } from '@/lib/supabase/server';
import { LOOK_FIELDS } from '@/lib/shopByLook';

// GET /api/shop-by-look - Active looks (public, cached 5 min at CDN)
export async function GET() {
    try {
        const supabase = createSupabasePublic();

        const { data: looks, error } = await supabase
            .from('shop_by_look')
            .select(LOOK_FIELDS)
            .eq('is_active', true)
            .order('display_order');

        if (error) {
            console.error('Shop by look fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ looks }, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' }
        });
    } catch (error) {
        console.error('Shop by look API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
