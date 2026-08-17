import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/** Storefront pages are statically cached (ISR + CDN). Without this an admin
 *  who reorders photos keeps seeing the old cover on the live site until the
 *  cache expires — which is exactly what "the cover I set isn't showing" was. */
function revalidateStorefront() {
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/product/[slug]', 'page');
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
};

// POST /api/products/:id/images - Upload product image (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = createSupabaseAdmin(); // Use admin client for storage

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const displayOrder = parseInt(formData.get('display_order') as string || '0');
        // Optional colour tag — gallery filters to the selected colour on the product page
        const color = (formData.get('color') as string) || null;

        if (!file || typeof file === 'string' || file.size === 0) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: `${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 8 MB.` },
                { status: 413 }
            );
        }

        if (file.type && !ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `${file.name} is a ${file.type} file. Upload a JPG, PNG or WebP.` },
                { status: 415 }
            );
        }

        // Upload to Supabase Storage.
        //
        // The name used to be `${id}/${Date.now()}.${ext}`. The admin form
        // uploads a product's photos in parallel, so two of them landing in
        // the same millisecond produced the same key — Storage rejects the
        // duplicate ("resource already exists") and that photo went missing.
        // A random segment makes collisions impossible.
        const fileExt = EXT_BY_TYPE[file.type] || (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const fileName = `${id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
                contentType: file.type || 'image/jpeg',
                cacheControl: '31536000',
                upsert: false,
            });

        if (uploadError) {
            console.error('Image upload error:', uploadError, { fileName, size: file.size, type: file.type });
            return NextResponse.json(
                { error: `Could not store ${file.name}: ${uploadError.message}` },
                { status: 500 }
            );
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
                display_order: displayOrder,
                color
            })
            .select()
            .single();

        if (dbError) {
            console.error('Image record error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        revalidateStorefront();
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

        // images should be array of { id, display_order, color? }
        if (!Array.isArray(images)) {
            return NextResponse.json({ error: 'Invalid images array' }, { status: 400 });
        }

        // Update order (and colour tag, when provided) for each image in parallel.
        // The position in the array is authoritative: the caller sends the list
        // in the order the admin arranged it, so index 0 is the cover. Trusting
        // the array rather than the client's own display_order field means two
        // photos can never end up sharing a position — a tie made the storefront
        // pick between them arbitrarily, and it did not always pick the cover.
        const results = await Promise.all(images.map((img, index) => {
            const patch: Record<string, unknown> = { display_order: index };
            if (img.color !== undefined) patch.color = img.color || null;

            return supabase
                .from('product_images')
                .update(patch)
                .eq('id', img.id)
                .eq('product_id', id);
        }));

        const failed = results.find((r) => r.error);
        if (failed?.error) {
            console.error('Image reorder error:', failed.error);
            return NextResponse.json({ error: failed.error.message }, { status: 500 });
        }

        // Fetch updated images
        const { data: updatedImages } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', id)
            .order('display_order')
            .order('created_at');

        revalidateStorefront();
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

        // Close the gap left behind, so the remaining photos keep positions
        // 0..n-1 and the first one is unambiguously the cover.
        const { data: remaining } = await supabase
            .from('product_images')
            .select('id')
            .eq('product_id', id)
            .order('display_order')
            .order('created_at');

        if (remaining) {
            await Promise.all(remaining.map((img, index) =>
                supabase
                    .from('product_images')
                    .update({ display_order: index })
                    .eq('id', img.id)
            ));
        }

        revalidateStorefront();
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Image delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
