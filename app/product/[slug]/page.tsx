import { notFound } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import { ProductPageClient } from "./ProductPageClient";

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server component - fetches data on server
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Create Supabase client for server-side fetch
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch product by slug
    const { data: product, error } = await supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name, slug),
            images:product_images(id, image_url, display_order),
            sizes:product_sizes(id, size, stock_count)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    // If product not found, show 404
    if (error || !product) {
        console.error('Product not found:', slug, error);
        notFound();
    }

    // Fetch reviews separately
    const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, user_id, created_at')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

    // Sort images by display_order
    const sortedImages = product.images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

    return (
        <ProductPageClient
            product={{
                ...product,
                images: sortedImages,
                reviews: reviews || []
            }}
        />
    );
}
