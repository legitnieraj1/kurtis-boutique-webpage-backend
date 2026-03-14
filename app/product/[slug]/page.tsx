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
        .select("name, description, price, sale_price, images:product_images(image_url, display_order), category:categories(name, slug)")
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

    // SEO optimized title: "Product Name | Kurtis Boutique India"
    const title = `${product.name} | Kurtis Boutique India`;
    const description = product.description
        ? `Buy ${product.name} from Kurtis Boutique. ${product.description.slice(0, 120)}... Premium ${categoryName.toLowerCase()} shipped across India. ₹${displayPrice}. COD available.`
        : `Buy ${product.name} online at Kurtis Boutique India. Premium ${categoryName.toLowerCase()} from trusted boutique brand with 30K+ Instagram followers. ₹${displayPrice}. Free delivery & COD across India.`;

    // SEO optimized image alt text
    const imageAlt = `${product.name} - ${categoryName} from Kurtis Boutique online store India`;

    return {
        title,
        description,
        keywords: [
            product.name.toLowerCase(),
            `buy ${product.name.toLowerCase()} online`,
            `${product.name.toLowerCase()} online india`,
            categoryName.toLowerCase(),
            `${categoryName.toLowerCase()} online India`,
            "kurtis boutique",
            "kurtis boutique online",
            "designer kurtis online",
            "buy kurtis online india",
            "ethnic wear boutique online",
            "boutique kurtis online india",
        ],
        alternates: { canonical: `/product/${slug}` },
        openGraph: {
            title: `${product.name} | Kurtis Boutique India`,
            description,
            url: `https://kurtisboutique.in/product/${slug}`,
            images: [{ url: mainImage, width: 800, height: 1000, alt: imageAlt }],
            type: "website",
            siteName: "Kurtis Boutique",
            locale: "en_IN",
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | Kurtis Boutique India`,
            description,
            images: [{ url: mainImage, alt: imageAlt }],
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
            sizes:product_sizes(id, size, stock_count),
            mom_baby_combos(*),
            family_combos(*),
            baby_size_prices(*)
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

    const categoryName = (product.category as any)?.name || "Ethnic Wear";
    const categorySlug = (product.category as any)?.slug || "shop";

    // Product JSON-LD Schema for Google rich results
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: sortedImages.map((img: any) => img.image_url),
        description: product.description || `${product.name} - Premium ${categoryName.toLowerCase()} from Kurtis Boutique India`,
        brand: {
            "@type": "Brand",
            name: "Kurtis Boutique",
            url: "https://kurtisboutique.in",
        },
        category: `Women's ${categoryName}`,
        sku: product.id,
        mpn: product.slug,
        offers: {
            "@type": "Offer",
            url: `https://kurtisboutique.in/product/${slug}`,
            priceCurrency: "INR",
            price: product.sale_price || product.price,
            priceValidUntil: "2027-12-31",
            availability: product.stock_remaining > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
                "@type": "Organization",
                name: "Kurtis Boutique",
                url: "https://kurtisboutique.in",
            },
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                    "@type": "MonetaryAmount",
                    value: "0",
                    currency: "INR",
                },
                shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "IN",
                },
                deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: {
                        "@type": "QuantitativeValue",
                        minValue: 1,
                        maxValue: 3,
                        unitCode: "d",
                    },
                    transitTime: {
                        "@type": "QuantitativeValue",
                        minValue: 3,
                        maxValue: 7,
                        unitCode: "d",
                    },
                },
            },
            hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "IN",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnByMail",
            },
        },
        ...(reviews && reviews.length > 0 && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1),
                reviewCount: reviews.length,
                bestRating: 5,
                worstRating: 1,
            },
            review: reviews.slice(0, 5).map((review: any) => ({
                "@type": "Review",
                reviewRating: {
                    "@type": "Rating",
                    ratingValue: review.rating,
                    bestRating: 5,
                },
                datePublished: review.created_at?.split("T")[0],
                reviewBody: review.comment || `Rated ${review.rating} stars`,
                author: {
                    "@type": "Person",
                    name: "Verified Buyer",
                },
            })),
        }),
    };

    // Breadcrumb schema for Google
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://kurtisboutique.in/",
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Shop",
                item: "https://kurtisboutique.in/shop",
            },
            {
                "@type": "ListItem",
                position: 3,
                name: categoryName,
                item: `https://kurtisboutique.in/shop?category=${categorySlug}`,
            },
            {
                "@type": "ListItem",
                position: 4,
                name: product.name,
                item: `https://kurtisboutique.in/product/${slug}`,
            },
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
