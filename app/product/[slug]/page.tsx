import { notFound } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import { ProductPageClient } from "./ProductPageClient";
import type { Metadata } from "next";

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to create Supabase client
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Dynamic SEO metadata for each product page
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const supabase = getSupabase();

    const { data: product } = await supabase
        .from("products")
        .select("name, description, price, sale_price, images:product_images(image_url, display_order), category:categories(name)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!product) {
        return { title: "Product Not Found" };
    }

    const sortedImages = product.images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
    const mainImage = sortedImages[0]?.image_url || "/kurtis-logo-large.png";
    const categoryName = (product.category as any)?.name || "Ethnic Wear";
    const displayPrice = product.sale_price || product.price;

    const title = `${product.name} - Buy ${categoryName} Online`;
    const description = product.description
        ? `${product.description.slice(0, 150)}... Shop at Kurtis Boutique. ₹${displayPrice}. Free delivery & COD available.`
        : `Buy ${product.name} online at Kurtis Boutique India. ₹${displayPrice}. Premium ${categoryName.toLowerCase()} with free delivery & COD across India.`;

    return {
        title,
        description,
        keywords: [
            product.name.toLowerCase(),
            `buy ${product.name.toLowerCase()} online`,
            categoryName.toLowerCase(),
            `${categoryName.toLowerCase()} online India`,
            "kurtis boutique",
            "designer kurtis",
            "ethnic wear online India",
        ],
        alternates: { canonical: `/product/${slug}` },
        openGraph: {
            title: `${product.name} | Kurtis Boutique`,
            description,
            url: `https://kurtisboutique.in/product/${slug}`,
            images: [{ url: mainImage, alt: product.name }],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | Kurtis Boutique`,
            description,
            images: [mainImage],
        },
    };
}

// Server component - fetches data on server
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = getSupabase();

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

    // Product JSON-LD Schema for Google rich results (price, rating, availability)
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: sortedImages.map((img: any) => img.image_url),
        description: product.description || `${product.name} - Premium ethnic wear from Kurtis Boutique`,
        brand: { "@type": "Brand", name: "Kurtis Boutique" },
        category: "Women's Ethnic Wear",
        offers: {
            "@type": "Offer",
            url: `https://kurtisboutique.in/product/${slug}`,
            priceCurrency: "INR",
            price: product.sale_price || product.price,
            priceValidUntil: "2026-12-31",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@id": "https://kurtisboutique.in/#organization" },
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
                deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "d" },
                    transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "d" },
                },
            },
        },
        ...(reviews && reviews.length > 0 && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1),
                reviewCount: reviews.length,
            },
        }),
    };

    // Breadcrumb schema for Google
    const categoryName = (product.category as any)?.name || "Shop";
    const categorySlug = (product.category as any)?.slug || "shop";
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://kurtisboutique.in/" },
            { "@type": "ListItem", position: 2, name: categoryName, item: `https://kurtisboutique.in/shop?category=${categorySlug}` },
            { "@type": "ListItem", position: 3, name: product.name, item: `https://kurtisboutique.in/product/${slug}` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <ProductPageClient
                product={{
                    ...product,
                    images: sortedImages,
                    reviews: reviews || []
                }}
            />
        </>
    );
}
