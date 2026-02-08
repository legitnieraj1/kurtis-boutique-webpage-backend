"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { Product } from "@/types";

const TABS = [
    { id: "kurti-coord", label: "Kurthi's / Co-ords" },
    { id: "work-three", label: "Workwear / Three-piece set" },
    { id: "maxi-casual", label: "Maxi's / Casual Wear" },
    { id: "festive", label: "Festive & Traditional Wear" },
    { id: "party", label: "Party Wear" },
    { id: "tot", label: "TOT Wear" },
] as const;

export function NewArrivalsSection() {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("kurti-coord");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch products. 
        // Ideally we fetch 'featured' or 'new' items. 
        // fetching all for client-side filtering for now to match previous logic
        fetch('/api/products?limit=50&sort=created_at&order=desc')
            .then(res => res.json())
            .then(data => {
                if (data.products) setProducts(data.products);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);


    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            if (!product.category) return false;
            // Assuming category is an object { name: '...', slug: '...' } or just ID if not joined
            // My API response joins category.
            const catName = typeof product.category === 'object' ? product.category.slug : String(product.category || "").toLowerCase();
            const pName = product.name.toLowerCase();

            switch (activeTab) {
                case "kurti-coord":
                    return catName === "kurtis" || catName === "aline" || pName.includes("co-ord");
                case "work-three":
                    return catName === "workwear" || catName === "sets";
                case "maxi-casual":
                    return catName === "maxis" || catName === "daily" || catName === "short" || catName === "dresses";
                case "festive":
                    return catName === "traditional" || catName === "festive";
                case "party":
                    return catName === "festive" || catName === "traditional" || (catName === "maxis" && product.price > 1500);
                case "tot":
                    return catName === "tot";
                default:
                    return false;
            }
        });
    }, [products, activeTab]);

    return (
        <section className="pt-32 pb-20 md:py-20 bg-[#faf9f6]"> {/* Ivory/White-ish background */}
            <div className="container mx-auto px-4 md:px-8">

                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <span className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        Summer Collection
                    </span>
                    <div className="w-24 h-[1px] bg-border mx-auto" /> {/* Subtle divider */}
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">
                        NEW ARRIVALS
                    </h2>
                </div>

                {/* Filter Tabs */}
                <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-y-6 gap-x-4 md:gap-4 mb-12 border-b border-border/50 pb-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative pb-3 px-2 text-sm md:text-base font-medium transition-colors duration-300 flex justify-center",
                                activeTab === tab.id
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-center">{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-lg" />)}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.map((product) => (
                                    <motion.div
                                        key={`${activeTab}-${product.id}`}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ProductCard product={product} hideWishlist />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {!loading && filteredProducts.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-muted-foreground"
                        >
                            <p>No new arrivals in this category yet.</p>
                        </motion.div>
                    )}
                </div>

            </div>
        </section>
    );
}
