import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/products/:id/images - Upload product image (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin(); // Use admin client for storage

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const displayOrder = parseInt(formData.get('display_order') as string || '0');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Image upload error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        // Save to product_images table
        const { data: imageRecord, error: dbError } = await supabase
            .from('product_images')
            .insert({
                product_id: id,
                image_url: urlData.publicUrl,
                display_order: displayOrder
            })
            .select()
            .single();

        if (dbError) {
            console.error('Image record error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ image: imageRecord }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/products/:id/images - Reorder images (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin();
        const { images } = await request.json();

        // images should be array of { id, display_order }
        if (!Array.isArray(images)) {
            return NextResponse.json({ error: 'Invalid images array' }, { status: 400 });
        }

        // Update order for each image
        for (const img of images) {
            await supabase
                .from('product_images')
                .update({ display_order: img.display_order })
                .eq('id', img.id)
                .eq('product_id', id);
        }

        // Fetch updated images
        const { data: updatedImages } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', id)
            .order('display_order');

        return NextResponse.json({ images: updatedImages });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Image reorder error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/products/:id/images - Delete image (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin();

        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('imageId');

        if (!imageId) {
            return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
        }

        // Get image record to get storage path
        const { data: image } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('id', imageId)
            .eq('product_id', id)
            .single();

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // Extract storage path from URL
        const urlParts = image.image_url.split('/product-images/');
        if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            await supabase.storage.from('product-images').remove([storagePath]);
        }

        // Delete from database
        await supabase
            .from('product_images')
            .delete()
            .eq('id', imageId);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Image delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
