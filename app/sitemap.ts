import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://kurtisboutique.in";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = getSupabase();

    // ─── Fetch all active products ─────────────────────────────────────────────
    const { data: products } = await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

    // ─── Fetch all categories ──────────────────────────────────────────────────
    const { data: categories } = await supabase
        .from("categories")
        .select("slug, name")
        .order("name");

    const now = new Date().toISOString();

    // ─── Static pages ──────────────────────────────────────────────────────────
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}/`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/shop`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.95,
        },
        {
            url: `${BASE_URL}/about-us`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.55,
        },
        {
            url: `${BASE_URL}/exchange-and-shipping`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/privacy-policy`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/payment-security`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.3,
        },
    ];

    // ─── Category filter pages ─────────────────────────────────────────────────
    // These target high-value keyword combinations like "designer kurtis online"
    const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
        url: `${BASE_URL}/shop?category=${cat.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.85,
    }));

    // Also add keyword-rich static category paths for SEO
    const keywordCategoryPages: MetadataRoute.Sitemap = [
        { slug: "designer-kurtis", priority: 0.9 },
        { slug: "cotton-kurtis", priority: 0.88 },
        { slug: "kurti-sets", priority: 0.88 },
        { slug: "festive-kurtis", priority: 0.87 },
        { slug: "mom-baby-combos", priority: 0.87 },
        { slug: "family-combos", priority: 0.86 },
    ].map(({ slug, priority }) => ({
        url: `${BASE_URL}/shop?category=${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority,
    }));

    // ─── Product pages ─────────────────────────────────────────────────────────
    // THIS IS CRITICAL — every product page must be in the sitemap
    const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${BASE_URL}/product/${product.slug}`,
        lastModified: product.updated_at || now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
    }));

    const allPages = [
        ...staticPages,
        ...categoryPages,
        ...keywordCategoryPages,
        ...productPages,
    ];

    // Deduplicate URLs
    const seen = new Set<string>();
    return allPages.filter((page) => {
        if (seen.has(page.url)) return false;
        seen.add(page.url);
        return true;
    });
}
