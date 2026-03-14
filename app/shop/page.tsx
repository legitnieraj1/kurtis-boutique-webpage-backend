"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Check, SlidersHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Define Types inline or import from types file
import { Product, Category } from "@/types";


function ShopContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category");

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<"new" | "price_asc" | "price_desc">("new");

    // Sync selectedCategory with URL param changes
    useEffect(() => {
        setSelectedCategory(categoryParam);
    }, [categoryParam]);

    // Fetch Data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('/api/products?limit=100').then(res => res.json()),
                    fetch('/api/categories').then(res => res.json())
                ]);

                if (productsRes.products) setProducts(productsRes.products);
                if (categoriesRes.categories) setCategories(categoriesRes.categories);
            } catch (error) {
                console.error("Failed to fetch shop data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Helper to resolve selected category to ID (handles slugs from URL)
    const activeCategoryId = useMemo(() => {
        if (!selectedCategory) return null;
        const category = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory);
        return category ? category.id : selectedCategory;
    }, [selectedCategory, categories]);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (activeCategoryId) {
            result = result.filter(p =>
                p.category_id === activeCategoryId ||
                (p.category && p.category.slug === selectedCategory)
            );
        }

        if (sortBy === "price_asc") {
            result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
        } else if (sortBy === "price_desc") {
            result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
        } else {
            // Newest
            result.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
        }

        return result;
    }, [activeCategoryId, selectedCategory, sortBy, products]);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex flex-col md:flex-row flex-1">
                {/* Sidebar */}
                <aside className={cn(
                    "w-full md:w-72 bg-white border-r border-border p-6 md:p-8 flex-shrink-0",
                    showFilters ? "block" : "hidden md:block"
                )}>
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h1 className="text-3xl font-serif font-medium">Shop Designer Kurtis Online</h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {loading ? "..." : filteredProducts.length} Products — Buy kurtis, ethnic wear &amp; boutique clothing online India
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-3 text-lg">Categories</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={cn(
                                            "flex items-center justify-between w-full text-sm text-left hover:text-primary transition-colors py-1",
                                            !activeCategoryId && "font-semibold text-primary"
                                        )}
                                    >
                                        All Products
                                        {!activeCategoryId && <Check className="w-4 h-4" />}
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={cn(
                                                "flex items-center justify-between w-full text-sm text-left hover:text-primary transition-colors py-1",
                                                activeCategoryId === cat.id && "font-semibold text-primary"
                                            )}
                                        >
                                            {cat.name}
                                            {activeCategoryId === cat.id && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background/60 backdrop-blur-sm">
                    <div className="flex justify-end mb-6 gap-2">
                        <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
                            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
                        </Button>

                        <select
                            className="h-10 rounded-md border border-input bg-background/80 px-3 py-2 text-sm max-w-[200px]"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="new">New Arrivals</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <Skeleton key={i} className="h-80 w-full rounded-md" />
                            ))}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-muted-foreground">
                            No products found.
                        </div>
                    )}

                    {/* SEO Content Block for Shop Page */}
                    <div className="mt-16 pt-12 border-t border-border/40">
                        <div className="max-w-none">
                            <h2 className="text-2xl font-serif mb-4">Buy Designer Kurtis Online at Kurtis Boutique India</h2>
                            <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
                                Welcome to the <strong>Kurtis Boutique</strong> online store — your trusted destination to <strong>buy designer kurtis online in India</strong>.
                                Browse our handpicked collection of <strong>cotton kurtis</strong>, <strong>designer kurti sets</strong>, <strong>festive kurti collections</strong>,
                                and <strong>ethnic wear</strong> for every occasion. As a leading <strong>ethnic wear boutique online</strong> with over <strong>30,000 Instagram followers</strong>,
                                we bring you premium quality boutique clothing shipped across India.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
                                Our collection includes <strong>Anarkali kurtas</strong>, <strong>A-line kurtis</strong>, <strong>straight kurtas for women</strong>,{" "}
                                <strong>co-ord sets</strong>, <strong>maternity kurtis</strong>, <strong>matching mom baby outfits</strong>,
                                and <strong>family combo ethnic wear</strong>. Every piece is crafted with care at our manufacturing facility in Madurai
                                and dispatched from Bangalore with love.
                            </p>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Enjoy free delivery, Cash on Delivery (COD), and secure payments via UPI, credit cards, and debit cards.
                                Follow us on <a href="https://www.instagram.com/kurtis.boutique/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram @kurtis.boutique</a> for
                                new arrivals, styling tips, and exclusive offers.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <ShopContent />
        </Suspense>
    );
}
