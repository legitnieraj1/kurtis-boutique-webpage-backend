"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ProductCardProps {
    product: Product;
    hideWishlist?: boolean;
}

export function ProductCard({ product, hideWishlist }: ProductCardProps) {
    const { isInWishlist, addToWishlist, removeFromWishlist } = useStore();
    const isWishlisted = isInWishlist(product.id);

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation(); // Prevent parent clicks
        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product.id);
        }
    };

    // Derived state
    const inStock = product.stock_remaining > 0 && product.is_active;
    const categoryName = product.category?.name || "Ethnic Wear";
    const mainImage = product.images?.[0]?.image_url || null;

    // SEO optimized alt text for images
    const imageAlt = `${product.name} - ${categoryName} from Kurtis Boutique online store India`;

    return (
        <article className="group relative flex flex-col gap-2" itemScope itemType="https://schema.org/Product">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary/10">
                <Link href={`/product/${product.slug}`} className="block w-full h-full" title={`Buy ${product.name} online at Kurtis Boutique India`}>
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={imageAlt}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mobile-gpu"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-stone-200 flex items-center justify-center text-stone-400">
                            <span className="text-xs">No Image</span>
                        </div>
                    )}

                    {!inStock && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />
                    )}
                </Link>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                    {product.discount_price && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide">
                            Sale
                        </span>
                    )}
                    {!inStock && (
                        <span className="bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                {!hideWishlist && (
                    <button
                        type="button"
                        className={cn(
                            "absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 inline-flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80",
                            isWishlisted && "opacity-100 text-red-500 bg-white"
                        )}
                        onClick={toggleWishlist}
                        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    >
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                    </button>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="font-serif text-base font-medium leading-none group-hover:text-primary transition-colors" itemProp="name">
                    <Link href={`/product/${product.slug}`} title={`${product.name} - Buy online at Kurtis Boutique India`}>{product.name}</Link>
                </h3>
                <p className="text-sm text-muted-foreground capitalize" itemProp="category">{categoryName}</p>
                <div className="flex items-center gap-2" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <meta itemProp="priceCurrency" content="INR" />
                    {product.discount_price ? (
                        <>
                            <span className="font-semibold text-foreground" itemProp="price" content={String(product.discount_price)}>{formatPrice(product.discount_price)}</span>
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                        </>
                    ) : (
                        <span className="font-semibold text-foreground" itemProp="price" content={String(product.price)}>{formatPrice(product.price)}</span>
                    )}
                    <link itemProp="availability" href={inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                </div>
            </div>
        </article>
    );
}
