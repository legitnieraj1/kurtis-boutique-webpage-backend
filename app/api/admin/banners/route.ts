import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';

// GET /api/admin/banners - List all banners (admin only)
export async function GET() {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();

        const { data: banners, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order');

        if (error) {
            console.error('Banners fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ banners });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin banners API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/banners - Create banner with image (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Handle file upload
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const title = formData.get('title') as string;
            const subtitle = formData.get('subtitle') as string;
            const link_url = formData.get('link_url') as string;
            const display_order = parseInt(formData.get('display_order') as string || '0');
            const is_active = formData.get('is_active') !== 'false';

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            // Upload to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Banner upload error:', uploadError);
                return NextResponse.json({ error: uploadError.message }, { status: 500 });
            }

            const { data: urlData } = supabase.storage
                .from('banners')
                .getPublicUrl(fileName);

            // Create banner record
            const { data: banner, error } = await supabase
                .from('banners')
                .insert({
                    title,
                    subtitle,
                    image_url: urlData.publicUrl,
                    link_url,
                    display_order,
                    is_active
                })
                .select()
                .single();

            if (error) {
                console.error('Banner creation error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ banner }, { status: 201 });
        } else {
            // Handle JSON (with existing image URL)
            const body = await request.json();
            const { title, subtitle, image_url, link_url, display_order = 0, is_active = true } = body;

            if (!image_url) {
                return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
            }

            const { data: banner, error } = await supabase
                .from('banners')
                .insert({ title, subtitle, image_url, link_url, display_order, is_active })
                .select()
                .single();

            if (error) {
                console.error('Banner creation error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ banner }, { status: 201 });
        }
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin banners API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
