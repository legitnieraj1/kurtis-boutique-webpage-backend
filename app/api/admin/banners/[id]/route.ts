import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/banners/:id - Update banner (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin();

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Handle file upload update
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const link_url = formData.get('link_url') as string;
            const is_active = formData.get('is_active') === 'true';

            const updateData: Record<string, unknown> = {};
            if (link_url !== undefined) updateData.link_url = link_url;
            if (is_active !== undefined) updateData.is_active = is_active;

            // Upload new image if provided
            if (file && file.size > 0) {
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

                updateData.image_url = urlData.publicUrl;
            }

            const { data: banner, error } = await supabase
                .from('banners')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Banner update error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ banner });
        } else {
            // JSON update
            const body = await request.json();
            const { title, subtitle, image_url, link_url, display_order, is_active } = body;

            const updateData: Record<string, unknown> = {};
            if (title !== undefined) updateData.title = title;
            if (subtitle !== undefined) updateData.subtitle = subtitle;
            if (image_url !== undefined) updateData.image_url = image_url;
            if (link_url !== undefined) updateData.link_url = link_url;
            if (display_order !== undefined) updateData.display_order = display_order;
            if (is_active !== undefined) updateData.is_active = is_active;

            const { data: banner, error } = await supabase
                .from('banners')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Banner update error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ banner });
        }
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin banner update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/banners/:id - Delete banner (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin();

        // Get banner to delete image from storage
        const { data: banner } = await supabase
            .from('banners')
            .select('image_url')
            .eq('id', id)
            .single();

        if (banner?.image_url) {
            const urlParts = banner.image_url.split('/banners/');
            if (urlParts.length > 1) {
                await supabase.storage.from('banners').remove([urlParts[1]]);
            }
        }

        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Banner delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin banner delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
