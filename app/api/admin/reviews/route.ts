import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createSupabaseAdmin } from '@/lib/supabase/server';

// GET /api/admin/reviews - List all reviews (admin only)
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const productId = searchParams.get('product_id');

        let query = supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data: reviews, error } = await query;

        if (error) {
            console.error('Reviews fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ reviews: reviews || [] });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin reviews API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/reviews - Create review with image upload (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdmin();

        // Handle FormData (with file upload)
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const reviewer_name = formData.get('reviewer_name') as string;
        const comment = formData.get('comment') as string;
        const rating = parseInt(formData.get('rating') as string, 10);

        if (!reviewer_name || !rating) {
            return NextResponse.json(
                { error: 'Missing required fields: reviewer_name, rating' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        let reviewer_image: string | null = null;

        // Upload image if provided
        if (file && file.size > 0) {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `review_${Date.now()}.${fileExt}`;
            const filePath = `reviews/${fileName}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from('reviews')
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('reviews')
                .getPublicUrl(filePath);

            reviewer_image = urlData.publicUrl;
        }

        // Insert review (without product_id since these are general testimonials)
        const { data: review, error } = await supabase
            .from('reviews')
            .insert({
                reviewer_name,
                reviewer_image,
                rating,
                comment,
                verified: true
            })
            .select()
            .single();

        if (error) {
            console.error('Review creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ review }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Admin reviews API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
