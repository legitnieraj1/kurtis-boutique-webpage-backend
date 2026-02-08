"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";

export default function WishlistPage() {
    const { wishlist } = useStore();
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (wishlist.length === 0) {
            setWishlistProducts([]);
            setLoading(false);
            return;
        }

        // Fetch user's wishlist items
        // Since we store IDs in local storage, we need to fetch them.
        // For now, we'll fetch all products and filter locally (not efficient for large DBs but fine for now)
        // OR better: call an API that accepts IDs. passing IDs in query param ?ids=1,2,3

        const fetchWishlist = async () => {
            try {
                // Construct query string with IDs
                // Note: GET URL length limits exist, but for <50 items it's fine.
                // For real prod, POST /api/products/batch or similar is better.
                // Implementing a simple client-side filter after fetching 'all' active products is easiest for short term 
                // if we don't have a specific batch endpoint.
                // Let's assume we can fetch all for now or I'll implement a dedicated 'ids' filter in /api/products later if needed.

                const res = await fetch('/api/products?limit=100'); // Get top 100 recent
                const data = await res.json();

                if (data.products) {
                    const filtered = data.products.filter((p: Product) => wishlist.includes(p.id));
                    setWishlistProducts(filtered);
                }
            } catch (error) {
                console.error("Failed to fetch wishlist products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [wishlist]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background/60 backdrop-blur-sm">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-serif mb-8">My Wishlist</h1>
                    <div className="animate-pulse space-y-4">
                        <div className="h-64 bg-secondary/20 rounded-lg"></div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background/60 backdrop-blur-sm text-foreground">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
                <h1 className="text-3xl md:text-4xl font-serif font-medium mb-8 text-center md:text-left">
                    My Wishlist
                    <span className="text-muted-foreground text-lg ml-3 font-sans font-normal">({wishlistProducts.length} items)</span>
                </h1>

                {wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {wishlistProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl">
                            💖
                        </div>
                        <h2 className="text-xl font-medium">Your wishlist is empty</h2>
                        <p className="text-muted-foreground max-w-sm">
                            Save items you love here to review later.
                        </p>
                        <Link href="/shop">
                            <Button size="lg" className="mt-4">Start Shopping</Button>
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
