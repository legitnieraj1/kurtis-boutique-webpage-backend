"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import { Product } from "@/types";
import Link from "next/link";

export function NewArrivalsSection() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch new arrivals
        fetch('/api/products?limit=20&sort=created_at&order=desc')
            .then(res => res.json())
            .then(data => {
                if (data.products) setProducts(data.products);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="pt-40 pb-20 md:py-24 bg-[#faf9f6]">
            <div className="container mx-auto px-4 md:px-8">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">
                        NEW ARRIVALS
                    </h2>
                    <div className="w-24 h-[1px] bg-primary/30 mx-auto" />
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Discover our latest collection of elegant and contemporary designs.
                    </p>
                </div>

                {/* Product Grid - No Tabs */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-[3/4] bg-stone-100 animate-pulse rounded-xl" />)}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
                        >
                            <AnimatePresence mode="popLayout">
                                {products.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                    >
                                        <ProductCard product={product} hideWishlist />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {!loading && products.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-muted-foreground"
                        >
                            <p>Check back soon for new arrivals.</p>
                        </motion.div>
                    )}

                    {!loading && products.length > 0 && (
                        <div className="mt-16 text-center">
                            <Link href="/shop" className="inline-block border-b border-primary text-primary pb-1 hover:text-primary/80 hover:border-primary/80 transition-colors uppercase tracking-widest text-sm font-medium">
                                View All Products
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
}
