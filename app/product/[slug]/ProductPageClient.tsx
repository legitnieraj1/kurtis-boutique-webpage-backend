"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, Minus, Plus, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { CustomisationForm } from "@/components/product/CustomisationForm";

interface Product {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    discount_price?: number;
    stock_remaining: number;
    images: { id: string; image_url: string; display_order: number }[];
    sizes: { id: string; size: string; stock_count: number }[];
    category: { id: string; name: string; slug: string } | null;
    reviews: { id: string; rating: number; comment: string; user_id: string; created_at: string }[];
    colors?: string[] | null;
    is_mom_baby?: boolean;
    is_family_combo?: boolean;
    mom_baby_combos?: { id: string; product_id: string; mom_price: number; baby_base_price: number; }[];
    family_combos?: { id: string; product_id: string; mother_price: number; father_price: number; baby_base_price: number; }[];
    baby_size_prices?: { id: string; product_id: string; size: string; price: number; }[];
}

interface ProductPageClientProps {
    product: Product;
}

export function ProductPageClient({ product }: ProductPageClientProps) {
    const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
    const isWishlisted = isInWishlist(product.id);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [comboType, setComboType] = useState<string>('single');
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState<string>(product.images?.[0]?.image_url || "");
    const [showSticky, setShowSticky] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    // Scroll Observer for sticky bar
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowSticky(!entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (actionsRef.current) observer.observe(actionsRef.current);
        return () => observer.disconnect();
    }, []);

    const inStock = product.stock_remaining > 0;
    
    // Dynamic Price Calculation
    let finalPrice = product.discount_price || product.price;
    let originalPrice = product.price;
    
    // Is base product using discount?
    let isDiscounted = !!product.discount_price && product.discount_price < product.price;

    if (comboType === 'mom_baby' && product.mom_baby_combos?.[0]) {
        finalPrice = product.mom_baby_combos[0].mom_price + product.mom_baby_combos[0].baby_base_price;
        originalPrice = finalPrice;
        isDiscounted = false; // Combos have fixed dynamic prices according to schema
    } else if (comboType === 'family' && product.family_combos?.[0]) {
        finalPrice = (product.family_combos[0].mother_price || 0) + (product.family_combos[0].father_price || 0) + (product.family_combos[0].baby_base_price || 0);
        originalPrice = finalPrice;
        isDiscounted = false;
    } else if (selectedSize && product.baby_size_prices?.length) {
        const babyPrice = product.baby_size_prices.find(p => p.size === selectedSize);
        if (babyPrice && babyPrice.price) {
            finalPrice = babyPrice.price;
            originalPrice = babyPrice.price;
            isDiscounted = false; // Baby sizes have fixed prices overriding base
        }
    }
    const categoryName = product.category?.name || "Uncategorized";

    const handleAddToCart = async () => {
        if (!selectedSize) {
            toast.error("Please select a size");
            return;
        }

        if (product.colors && product.colors.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }

        const success = await addToCart(product.id, selectedSize, selectedColor, comboType, quantity);

        if (success) {
            toast.success("Added to Cart");
        } else {
            toast.error("Please login to add to cart");
        }
    };

    const toggleWishlist = () => {
        if (isWishlisted) {
            removeFromWishlist(product.id);
            toast.success("Removed from Wishlist");
        } else {
            addToWishlist(product.id);
            toast.success("Added to Wishlist");
        }
    };

    const displayImages = product.images?.map(img => img.image_url) || [];

    return (
        <div className="min-h-screen bg-background/60 backdrop-blur-sm">
            <Navbar />

            <main className="container mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

                    {/* IMAGE GALLERY */}
                    <div className="w-full md:w-1/2 space-y-4">
                        <div className="relative aspect-[4/5] md:aspect-[3/4] bg-secondary/20 rounded-lg overflow-hidden group">
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={`${product.name} - ${categoryName} from Kurtis Boutique online store India`}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-stone-200 flex items-center justify-center text-stone-400">
                                    <span>No Image Available</span>
                                </div>
                            )}
                        </div>

                        {displayImages.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {displayImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "relative w-20 aspect-[3/4] rounded-md overflow-hidden bg-muted border-2 transition-all flex-shrink-0",
                                            activeImage === img ? "border-primary" : "border-transparent"
                                        )}
                                    >
                                        <img src={img} alt={`${product.name} - Image ${idx + 1} - Kurtis Boutique India`} loading="lazy" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DETAILS */}
                    <div className="w-full md:w-1/2 space-y-5 md:space-y-8">
                        <div>
                            <nav className="text-sm text-muted-foreground mb-2 md:mb-4">
                                <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="text-foreground capitalize">{product.name}</span>
                            </nav>
                            <h1 className="text-2xl md:text-4xl font-serif font-medium text-foreground tracking-tight">{product.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{categoryName}</p>

                            <div className="mt-4 flex items-center gap-4">
                                {isDiscounted ? (
                                    <div className="text-2xl font-semibold">
                                        <span className="text-foreground">{formatPrice(finalPrice)}</span>
                                        <span className="text-muted-foreground line-through text-lg ml-2 font-normal">{formatPrice(originalPrice)}</span>
                                        <span className="text-green-600 text-sm ml-2 font-medium">
                                            Save {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-semibold text-foreground">{formatPrice(finalPrice)}</div>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-stone text-muted-foreground">
                            <p>{product.description}</p>
                        </div>

                        {/* COMBO TYPES */}
                        {(product.is_mom_baby || product.is_family_combo) && (
                            <div className="mb-6 space-y-3">
                                <label className="font-medium text-sm">Select Option</label>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setComboType('single')}
                                        className={cn("flex items-center justify-between p-3 border rounded-lg text-left transition-all", comboType === 'single' ? "border-primary ring-1 ring-primary" : "hover:border-primary/50")}
                                    >
                                        <span className="font-medium text-sm">Just for Me (Single)</span>
                                        {comboType === 'single' && <span className="w-2 h-2 rounded-full bg-primary" />}
                                    </button>

                                    {product.is_mom_baby && (
                                        <button
                                            onClick={() => setComboType('mom_baby')}
                                            className={cn("flex items-center justify-between p-3 border rounded-lg text-left transition-all", comboType === 'mom_baby' ? "border-primary ring-1 ring-primary" : "hover:border-primary/50")}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">Mom & Baby Combo</span>
                                                <span className="text-xs text-muted-foreground mt-0.5">Matching outfit for mother and child</span>
                                            </div>
                                            {comboType === 'mom_baby' && <span className="w-2 h-2 rounded-full bg-primary" />}
                                        </button>
                                    )}

                                    {product.is_family_combo && (
                                        <button
                                            onClick={() => setComboType('family')}
                                            className={cn("flex items-center justify-between p-3 border rounded-lg text-left transition-all", comboType === 'family' ? "border-primary ring-1 ring-primary" : "hover:border-primary/50")}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">Family Combo</span>
                                                <span className="text-xs text-muted-foreground mt-0.5">Matching outfits for mother, father, and child</span>
                                            </div>
                                            {comboType === 'family' && <span className="w-2 h-2 rounded-full bg-primary" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* COLORS */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-6">
                                <label className="font-medium text-sm mb-2 block">Select Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {product.colors.map(colorStr => {
                                        const [name, hex] = colorStr.includes('|') ? colorStr.split('|') : [colorStr, '#cccccc'];
                                        return (
                                            <button
                                                key={colorStr}
                                                onClick={() => setSelectedColor(colorStr)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm transition-all",
                                                    selectedColor === colorStr
                                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                                        : "border-input hover:border-primary/50 bg-background text-foreground"
                                                )}
                                            >
                                                <span 
                                                    className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                                                    style={{ backgroundColor: hex }}
                                                />
                                                <span className={selectedColor === colorStr ? "font-medium text-primary" : ""}>
                                                    {name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SIZES */}
                        <div id="size-selector">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-sm">Select Size</span>
                                <button className="text-xs underline text-muted-foreground hover:text-primary">Size Chart</button>
                            </div>
                            <div className="flex gap-3">
                                {product.sizes?.map(sizeObj => (
                                    <button
                                        key={sizeObj.size}
                                        onClick={() => setSelectedSize(sizeObj.size)}
                                        disabled={!inStock}
                                        className={cn(
                                            "w-10 h-10 rounded-full border flex items-center justify-center text-sm transition-all",
                                            selectedSize === sizeObj.size
                                                ? "border-primary bg-primary text-white"
                                                : "border-input hover:border-primary/50",
                                            !inStock && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {sizeObj.size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div ref={actionsRef} className="flex items-center gap-2 md:gap-3 pt-4 border-t border-border">
                            <div className="flex items-center border border-input rounded-md h-10 md:h-14">
                                <button
                                    className="px-2 md:px-3 h-full hover:bg-muted border-r border-input"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                                <span className="w-8 md:w-10 text-center text-sm font-medium">{quantity}</span>
                                <button
                                    className="px-2 md:px-3 h-full hover:bg-muted border-l border-input"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                            </div>

                            <Button
                                size="lg"
                                className="flex-1 h-12 md:h-14 rounded-full bg-gradient-to-r from-primary via-rose-600 to-primary bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 text-sm md:text-base font-bold tracking-widest uppercase hover:-translate-y-0.5"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                            >
                                {inStock ? "Add to Cart" : "Out of Stock"}
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className={cn("h-10 w-10 md:h-14 md:w-14 rounded-full flex-shrink-0", isWishlisted && "text-red-500 bg-red-50")}
                                onClick={toggleWishlist}
                            >
                                <Heart className={cn("w-4 h-4 md:w-5 md:h-5", isWishlisted && "fill-current")} />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-6">
                            <div className="flex items-center gap-3 text-sm text-foreground/80">
                                <Truck className="w-5 h-5 text-muted-foreground" />
                                <span>Nationwide Shipping Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-foreground/80">
                                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                                <span>100% Secure Payment</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-foreground/80">
                                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                                <span>Easy 7-day Exchange Policy</span>
                            </div>
                        </div>

                        <CustomisationForm productId={product.id} productName={product.name} />
                    </div>
                </div>
            </main>

            {/* STICKY BOTTOM BAR (MOBILE) */}
            <div className="md:hidden sticky bottom-4 z-40 px-1 pointer-events-none">
                <AnimatePresence>
                    {showSticky && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="pointer-events-auto"
                        >
                            <div className="flex items-center gap-3 p-3 pl-4 rounded-xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl ring-1 ring-black/5">
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-medium text-muted-foreground truncate">{product.name}</span>
                                    <span className="font-bold text-base text-foreground">{formatPrice(finalPrice)}</span>
                                </div>
                                <Button className="shadow-md h-10 px-5 rounded-lg bg-primary text-white text-sm" onClick={() => {
                                    if (!selectedSize) {
                                        document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        toast.info("Please select a size");
                                    } else handleAddToCart();
                                }} disabled={!inStock}>
                                    {inStock ? "Add" : "No Stock"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Footer />
        </div>
    );
}
