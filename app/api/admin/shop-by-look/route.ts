import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';
import { LOOK_FIELDS } from '@/lib/shopByLook';

// GET /api/admin/shop-by-look - List all looks (admin only)
export async function GET() {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();

        const { data: looks, error } = await supabase
            .from('shop_by_look')
            .select(LOOK_FIELDS)
            .order('display_order');

        if (error) {
            console.error('Shop by look fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ looks });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin shop-by-look API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/shop-by-look - Create a look (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();

        const body = await request.json();
        const {
            title,
            description,
            instagram_url,
            video_url,
            thumbnail_url,
            product_id,
            display_order = 0,
            is_active = true,
        } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }
        if (!instagram_url && !video_url) {
            return NextResponse.json(
                { error: 'An Instagram reel link or a video URL is required' },
                { status: 400 }
            );
        }

        const { data: look, error } = await supabase
            .from('shop_by_look')
            .insert({
                title: title || null,
                description: description || null,
                instagram_url: instagram_url || null,
                video_url: video_url || null,
                thumbnail_url: thumbnail_url || null,
                product_id,
                display_order,
                is_active,
            })
            .select(LOOK_FIELDS)
            .single();

        if (error) {
            console.error('Look creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ look }, { status: 201 });
    } catch (error: any) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin shop-by-look API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
