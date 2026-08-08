"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { cn, formatPrice, sortBySize } from "@/lib/utils";

/** Shape returned by GET /api/products/:idOrSlug — only the parts quick view reads. */
interface QuickViewProduct {
    id: string;
    slug: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    stock_remaining: number;
    images: { id: string; image_url: string; display_order: number }[];
    sizes: { id: string; size: string; stock_count: number }[];
    category?: { name: string } | null;
    colors?: string[] | null;
    is_mom_baby?: boolean;
    is_family_combo?: boolean;
    is_couple_combo?: boolean;
    allow_baby_only?: boolean;
    addons?: { id: string; name: string; price: number }[];
    baby_size_prices?: { id: string; size: string; price: number }[];
}

interface QuickViewModalProps {
    /** Product slug to load. Modal renders nothing while null. */
    slug: string | null;
    onClose: () => void;
}

export function QuickViewModal({ slug, onClose }: QuickViewModalProps) {
    const { addToCart, setIsCartOpen } = useStore();

    const [mounted, setMounted] = useState(false);
    const [product, setProduct] = useState<QuickViewProduct | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeImage, setActiveImage] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [descOpen, setDescOpen] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => setMounted(true), []);

    // Load the full product when the modal opens; reset state when it closes.
    useEffect(() => {
        if (!slug) {
            setProduct(null);
            setSelectedSize(null);
            setDescOpen(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        fetch(`/api/products/${slug}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Product not found"))))
            .then((data) => {
                if (cancelled) return;
                const p: QuickViewProduct = data.product;
                p.images = [...(p.images || [])].sort((a, b) => a.display_order - b.display_order);
                p.sizes = sortBySize(p.sizes, (s) => s.size);
                setProduct(p);
                setActiveImage(p.images?.[0]?.image_url || "");
            })
            .catch(() => {
                if (!cancelled) toast.error("Could not load this product");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    // Lock body scroll + close on Escape while open.
    useEffect(() => {
        if (!slug) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [slug, onClose]);

    if (!mounted) return null;

    // Combos, add-ons, colours and per-size baby pricing all need the full
    // option flow on the product page — quick view only sells the simple case.
    const needsFullPage = !!product && (
        product.is_mom_baby ||
        product.is_family_combo ||
        product.is_couple_combo ||
        product.allow_baby_only ||
        (product.addons?.length ?? 0) > 0 ||
        (product.colors?.length ?? 0) > 0 ||
        (product.baby_size_prices?.length ?? 0) > 0
    );

    const inStock = !!product && product.stock_remaining > 0;
    const finalPrice = product ? (product.discount_price || product.price) : 0;
    const isDiscounted = !!product?.discount_price && product.discount_price < product.price;

    const handleAddToCart = async () => {
        if (!product) return;
        if (product.sizes?.length && !selectedSize) {
            toast.error("Please select a size");
            return;
        }

        setAdding(true);
        try {
            await addToCart(
                product.id,
                selectedSize || "Free Size",
                null,
                "single",
                1,
                null,
                {
                    name: product.name,
                    price: product.price,
                    discount_price: product.discount_price,
                    images: product.images?.map((img) => ({ image_url: img.image_url })) || [],
                },
                null
            );
            toast.success("Added to cart!");
            onClose();
            setIsCartOpen(true);
        } finally {
            setAdding(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {slug && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Product quick view"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative w-full sm:max-w-5xl max-h-full sm:max-h-[90vh] overflow-y-auto bg-background sm:rounded-xl shadow-2xl"
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close quick view"
                            className="absolute top-3 right-3 z-10 h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-muted transition-colors shadow-sm"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {loading || !product ? (
                            <div className="flex items-center justify-center h-[60vh]">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6 md:gap-10 p-4 sm:p-6 md:p-8">
                                {/* GALLERY */}
                                <div className="flex gap-3">
                                    {product.images.length > 1 && (
                                        <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0 max-h-[520px] overflow-y-auto">
                                            {product.images.slice(0, 6).map((img) => (
                                                <button
                                                    key={img.id}
                                                    type="button"
                                                    onClick={() => setActiveImage(img.image_url)}
                                                    className={cn(
                                                        "relative aspect-[3/4] w-full overflow-hidden rounded-md border transition-colors",
                                                        activeImage === img.image_url ? "border-primary" : "border-transparent hover:border-border"
                                                    )}
                                                >
                                                    <Image
                                                        src={img.image_url}
                                                        alt=""
                                                        fill
                                                        sizes="64px"
                                                        quality={70}
                                                        className="object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative flex-1 aspect-[3/4] overflow-hidden rounded-lg bg-secondary/10">
                                        {activeImage ? (
                                            <Image
                                                src={activeImage}
                                                alt={`${product.name} - ${product.category?.name || "Ethnic Wear"} from Kurtis Boutique`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 40vw"
                                                quality={80}
                                                className="object-cover"
                                                priority
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div className="space-y-5">
                                    <div className="space-y-1 pr-10">
                                        <h2 className="font-serif text-2xl md:text-3xl leading-tight">{product.name}</h2>
                                        {product.category?.name && (
                                            <p className="text-sm text-muted-foreground capitalize">{product.category.name}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-semibold">{formatPrice(finalPrice)}</span>
                                        {isDiscounted && (
                                            <span className="text-sm text-muted-foreground line-through">
                                                {formatPrice(product.price)}
                                            </span>
                                        )}
                                    </div>

                                    {!inStock && (
                                        <p className="text-sm font-medium text-destructive">Out of stock</p>
                                    )}

                                    {/* Sizes — only for the simple single-piece flow */}
                                    {inStock && !needsFullPage && product.sizes?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Select Size</p>
                                            <div className="flex flex-wrap gap-2">
                                                {product.sizes.map((s) => {
                                                    const soldOut = s.stock_count <= 0;
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            disabled={soldOut}
                                                            onClick={() => setSelectedSize(s.size)}
                                                            className={cn(
                                                                "min-w-[3rem] px-3 py-2 text-sm rounded-md border transition-colors",
                                                                selectedSize === s.size
                                                                    ? "border-primary bg-primary text-primary-foreground"
                                                                    : "border-border hover:border-primary",
                                                                soldOut && "opacity-40 cursor-not-allowed line-through hover:border-border"
                                                            )}
                                                        >
                                                            {s.size}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Primary action */}
                                    {!inStock ? (
                                        <Link
                                            href={`/product/${product.slug}`}
                                            className="block w-full text-center rounded-full border border-border py-3.5 text-sm font-medium hover:bg-muted transition-colors"
                                        >
                                            View Product
                                        </Link>
                                    ) : needsFullPage ? (
                                        <Link
                                            href={`/product/${product.slug}`}
                                            className="block w-full text-center rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium tracking-wide hover:bg-primary-hover transition-colors"
                                        >
                                            Choose Options
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleAddToCart}
                                            disabled={adding}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium tracking-wide hover:bg-primary-hover transition-colors disabled:opacity-60"
                                        >
                                            {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                                            ADD TO CART
                                        </button>
                                    )}

                                    <Link
                                        href={`/product/${product.slug}`}
                                        className="block text-center text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                                    >
                                        View full details
                                    </Link>

                                    {/* Description accordion */}
                                    {product.description && (
                                        <div className="border-t border-border pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setDescOpen((v) => !v)}
                                                className="w-full flex items-center justify-between py-3 text-xs uppercase tracking-[0.15em] text-foreground"
                                            >
                                                Description
                                                <ChevronDown className={cn("h-4 w-4 transition-transform", descOpen && "rotate-180")} />
                                            </button>
                                            {descOpen && (
                                                <p className="pb-4 text-sm text-muted-foreground whitespace-pre-line">
                                                    {product.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
