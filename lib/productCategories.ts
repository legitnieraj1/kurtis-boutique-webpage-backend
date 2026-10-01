import type { SupabaseClient } from '@supabase/supabase-js';

// A product can sit in several categories (a Diwali kurti that is also in
// Sarees). They are stored in `products.category_ids`, a uuid[] column.
//
// `products.category_id` is kept as the product's *primary* category — the
// first one the admin picked, always equal to category_ids[0]. Everything that
// shows a single label per product (cards, breadcrumbs, SEO schema) still
// reads that column; category filtering reads the whole list.
// See migration-product-categories.sql.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cleans the category list from a request body: drops anything that is not a
 * UUID and removes duplicates, keeping order (the first id is the primary).
 * Falls back to the legacy single `category_id` for callers that predate
 * multi-category support.
 */
export function normalizeCategoryIds(categoryIds: unknown, legacyCategoryId?: unknown): string[] {
    const raw: unknown[] = Array.isArray(categoryIds)
        ? categoryIds
        : legacyCategoryId
            ? [legacyCategoryId]
            : [];
    return [...new Set(raw.filter((id): id is string => typeof id === 'string' && UUID.test(id)))];
}

interface WithCategories {
    category_id?: string | null;
    category_ids?: string[] | null;
}

/**
 * Every category id a product belongs to, primary first. Reads category_id as
 * well as the array so a product still resolves correctly if it was saved
 * before the array existed.
 */
export function getProductCategoryIds(product: WithCategories): string[] {
    const ids = [product.category_id, ...(product.category_ids || [])];
    return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * Active categories, each carrying the active products that belong to it
 * (with their images, for the category tiles).
 *
 * This used to be a nested `products:products(...)` embed, which only follows
 * `products.category_id`. Membership now comes from the whole category_ids
 * list, so the grouping happens here — in one place — instead of in each of
 * the three pages that render category tiles.
 */
export async function fetchCategoriesWithProducts(supabase: SupabaseClient) {
    const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        // `*` rather than naming category_ids: the navbar, footer and home page
        // all read this, and naming the column would take them down in the
        // window between deploying and running the migration. With `*` a
        // product that has no category_ids yet just falls back to category_id.
        supabase.from('products').select('*, product_images(image_url)').eq('is_active', true),
    ]);

    const error = categoriesRes.error || productsRes.error;
    if (error) return { data: null, error };

    const products = productsRes.data || [];
    const data = (categoriesRes.data || []).map(category => ({
        ...category,
        products: products
            .filter(product => getProductCategoryIds(product).includes(category.id))
            .map(({ id, name, product_images }) => ({ id, name, product_images })),
    }));

    return { data, error: null };
}
