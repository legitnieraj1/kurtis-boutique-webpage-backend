import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createSupabasePublic } from "@/lib/supabase/server";
import { ShopClient } from "./ShopClient";
import { Product, Category } from "@/types";

// ISR: statically render shop page, re-generate in background every 5 minutes.
// Category filtering and sorting happen client-side on the pre-fetched list.
export const revalidate = 300;

async function getShopData() {
    const supabase = createSupabasePublic();

    const [productsRes, categoriesRes] = await Promise.all([
        supabase
            .from("products")
            .select(`
                *,
                category:categories(id, name, slug),
                images:product_images(id, image_url, display_order, color),
                sizes:product_sizes(id, size, stock_count),
                mom_baby_combos(id, mom_price, baby_base_price),
                family_combos(id, mother_price, father_price, baby_base_price),
                couple_combos(id, women_price, men_price),
                addons:product_addons(id, name, price),
                baby_size_prices(id, size, price)
            `)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(100),
        supabase
            .from("categories")
            .select(`
                *,
                products:products(
                    id,
                    name,
                    product_images(image_url)
                )
            `)
            .eq("is_active", true)
            .eq("products.is_active", true)
            .order("display_order"),
    ]);

    return {
        products: (productsRes.data || []) as unknown as Product[],
        categories: (categoriesRes.data || []) as unknown as Category[],
    };
}

export default async function ShopPage() {
    const { products, categories } = await getShopData();

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <ShopClient initialProducts={products} initialCategories={categories} />
        </Suspense>
    );
}
