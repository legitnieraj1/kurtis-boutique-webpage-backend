"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, Minus, Plus, Truck, ShieldCheck, RefreshCw, Zap, ChevronDown } from "lucide-react";
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
    images: { id: string; image_url: string; display_order: number; color?: string | null }[];
    sizes: { id: string; size: string; stock_count: number }[];
    category: { id: string; name: string; slug: string } | null;
    reviews: { id: string; rating: number; comment: string; user_id: string; created_at: string }[];
    colors?: string[] | null;
    is_mom_baby?: boolean;
    is_family_combo?: boolean;
    is_couple_combo?: boolean;
    allow_baby_only?: boolean;
    addons?: { id: string; name: string; price: number }[];
    mom_baby_combos?: { id: string; product_id: string; mom_price: number; baby_base_price: number }[];
    family_combos?: { id: string; product_id: string; mother_price: number; father_price: number; baby_base_price: number }[];
    couple_combos?: { id: string; product_id: string; women_price: number; men_price: number }[];
    baby_size_prices?: { id: string; product_id: string; size: string; price: number }[];
}

interface ProductPageClientProps {
    product: Product;
}

export function ProductPageClient({ product }: ProductPageClientProps) {
    const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, setIsCartOpen } = useStore();
    const router = useRouter();
    const isWishlisted = isInWishlist(product.id);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedFatherSize, setSelectedFatherSize] = useState<string | null>(null);
    const [selectedMotherSize, setSelectedMotherSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedBabySize, setSelectedBabySize] = useState<string | null>(null);
    const [selectedBabyGender, setSelectedBabyGender] = useState<string | null>(null);
    const [comboType, setComboType] = useState<string>('single');
    const [quantity, setQuantity] = useState(1);
    // Additional babies beyond the first (mom & baby combo only)
    const [extraBabies, setExtraBabies] = useState<{ size: string; gender: string }[]>([]);
    // Customisation add-ons (charged extra, prices set per product in admin)
    const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
    const [activeImage, setActiveImage] = useState<string>(product.images?.[0]?.image_url || "");
    const [showSticky, setShowSticky] = useState(false);
    const [descOpen, setDescOpen] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowSticky(!entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (actionsRef.current) observer.observe(actionsRef.current);
        return () => observer.disconnect();
    }, []);

    const inStock = product.stock_remaining > 0;

    const babyPriceFor = (size: string | null, fallback: number) => {
        if (size && product.baby_size_prices?.length) {
            const match = product.baby_size_prices.find(p => p.size === size);
            if (match?.price) return match.price;
        }
        return fallback;
    };

    let finalPrice = product.discount_price || product.price;
    let originalPrice = product.price;
    let isDiscounted = !!product.discount_price && product.discount_price < product.price;

    if (comboType === 'mom_baby' && product.mom_baby_combos?.[0]) {
        const combo = product.mom_baby_combos[0];
        finalPrice = combo.mom_price + babyPriceFor(selectedBabySize, combo.baby_base_price);
        for (const baby of extraBabies) {
            finalPrice += babyPriceFor(baby.size, combo.baby_base_price);
        }
        originalPrice = finalPrice;
        isDiscounted = false;
    } else if (comboType === 'family' && product.family_combos?.[0]) {
        const fCombo = product.family_combos[0];
        finalPrice = (fCombo.mother_price || 0) + (fCombo.father_price || 0) + babyPriceFor(selectedBabySize, fCombo.baby_base_price || 0);
        originalPrice = finalPrice;
        isDiscounted = false;
    } else if (comboType === 'couple' && product.couple_combos?.[0]) {
        const cCombo = product.couple_combos[0];
        finalPrice = (cCombo.women_price || 0) + (cCombo.men_price || 0);
        originalPrice = finalPrice;
        isDiscounted = false;
    } else if (comboType === 'baby_only') {
        finalPrice = babyPriceFor(selectedBabySize, product.discount_price || product.price);
        originalPrice = finalPrice;
        isDiscounted = false;
    } else if (selectedSize && product.baby_size_prices?.length) {
        const babyPrice = product.baby_size_prices.find(p => p.size === selectedSize);
        if (babyPrice?.price) {
            finalPrice = babyPrice.price;
            originalPrice = babyPrice.price;
            isDiscounted = false;
        }
    }

    // Customisation add-on charges (not applicable to baby-only orders)
    const addonsAllowed = comboType !== 'baby_only';
    const selectedAddons = addonsAllowed
        ? (product.addons || []).filter(a => selectedAddonIds.includes(a.id))
        : [];
    finalPrice += selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);

    const categoryName = product.category?.name || "Uncategorized";

    // Purchase options, in the order they should be offered. Badges nudge toward
    // the combos — they're the brand's signature and the higher-value baskets.
    const comboOptions = [
        { id: 'single', label: 'Just for Me', description: 'A single piece, styled for you', badge: null, show: true },
        { id: 'mom_baby', label: 'Mom & Baby Combo', description: 'Matching outfits for mother and child', badge: 'Most Loved', show: !!product.is_mom_baby },
        { id: 'family', label: 'Family Combo', description: 'Matching outfits for mother, father and child', badge: 'Best Value', show: !!product.is_family_combo },
        { id: 'couple', label: 'Couples Combo', description: 'Her outfit with a matching shirt for him', badge: null, show: !!product.is_couple_combo },
        { id: 'baby_only', label: 'Baby Only', description: 'Just the baby dress', badge: null, show: !!product.allow_baby_only },
    ].filter(o => o.show);

    // Build product data snapshot for localStorage cart
    const buildProductData = () => ({
        name: product.name,
        price: product.price,
        discount_price: product.discount_price,
        images: product.images?.map(img => ({ image_url: img.image_url })) || [],
        is_mom_baby: product.is_mom_baby,
        is_family_combo: product.is_family_combo,
        is_couple_combo: product.is_couple_combo,
        allow_baby_only: product.allow_baby_only,
        addons: product.addons?.map(a => ({ id: a.id, name: a.name, price: a.price })),
        mom_baby_combos: product.mom_baby_combos?.map(c => ({ mom_price: c.mom_price, baby_base_price: c.baby_base_price })),
        family_combos: product.family_combos?.map(c => ({ mother_price: c.mother_price, father_price: c.father_price, baby_base_price: c.baby_base_price })),
        couple_combos: product.couple_combos?.map(c => ({ women_price: c.women_price, men_price: c.men_price })),
        baby_size_prices: product.baby_size_prices?.map(bp => ({ size: bp.size, price: bp.price })),
    });

    const addonSuffix = () => {
        if (comboType === 'baby_only') return '';
        const parts: string[] = [];
        selectedAddons.forEach(a => parts.push(a.name));
        return parts.length ? ` + ${parts.join(' + ')}` : '';
    };

    const buildFinalSize = () => {
        let s: string;
        if (comboType === 'family') {
            s = `Father: ${selectedFatherSize}, Mother: ${selectedMotherSize}${selectedBabyGender ? `, Baby: ${selectedBabyGender}` : ''}`;
        } else if (comboType === 'couple') {
            s = `Women: ${selectedMotherSize}, Men: ${selectedFatherSize}`;
        } else if (comboType === 'baby_only') {
            s = `Baby: ${selectedBabySize}${selectedBabyGender ? ` (${selectedBabyGender})` : ''}`;
        } else if (comboType === 'mom_baby') {
            s = `Mom: ${selectedSize}, Baby 1: ${selectedBabySize}${selectedBabyGender ? ` (${selectedBabyGender})` : ''}`;
            extraBabies.forEach((baby, i) => {
                s += `, Baby ${i + 2}: ${baby.size} (${baby.gender})`;
            });
        } else {
            s = selectedSize!;
        }
        return s + addonSuffix();
    };

    const validateSelections = (): boolean => {
        if (comboType === 'family') {
            if (!selectedFatherSize || !selectedMotherSize) {
                toast.error("Please select both Father and Mother sizes");
                return false;
            }
        } else if (comboType === 'couple') {
            if (!selectedMotherSize || !selectedFatherSize) {
                toast.error("Please select both Women's and Men's sizes");
                return false;
            }
        } else if (comboType === 'baby_only') {
            if (!selectedBabySize) { toast.error("Please select a baby size"); return false; }
            if (!selectedBabyGender) { toast.error("Please select baby gender"); return false; }
        } else if (!selectedSize) {
            toast.error(comboType === 'mom_baby' ? "Please select Mom's size" : "Please select a size");
            return false;
        }

        if (comboType !== 'baby_only' && product.colors && product.colors.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return false;
        }

        if ((comboType === 'mom_baby' || comboType === 'family') && product.baby_size_prices?.length) {
            if (!selectedBabySize) { toast.error("Please select a baby size"); return false; }
            if (!selectedBabyGender) { toast.error("Please select baby gender"); return false; }
        }

        if (comboType === 'mom_baby') {
            for (let i = 0; i < extraBabies.length; i++) {
                if (!extraBabies[i].size) { toast.error(`Please select a size for Baby ${i + 2}`); return false; }
                if (!extraBabies[i].gender) { toast.error(`Please select gender for Baby ${i + 2}`); return false; }
            }
        }

        return true;
    };

    const buildAddons = () => {
        const addons: { selected?: { name: string; price: number }[]; babies?: { size: string; gender: string }[] } = {};
        if (selectedAddons.length > 0) addons.selected = selectedAddons.map(a => ({ name: a.name, price: a.price }));
        if (comboType === 'mom_baby' && extraBabies.length > 0) addons.babies = extraBabies;
        return Object.keys(addons).length > 0 ? addons : null;
    };

    const handleAddToCart = async () => {
        if (!validateSelections()) return;

        const babySize = (comboType === 'mom_baby' || comboType === 'family' || comboType === 'baby_only') ? selectedBabySize : null;
        const finalSize = buildFinalSize();

        await addToCart(product.id, finalSize, selectedColor, comboType, quantity, babySize, buildProductData(), buildAddons());
        toast.success("Added to cart!");
        // Auto-open cart drawer
        setIsCartOpen(true);
    };

    const handleBuyNow = async () => {
        if (!validateSelections()) return;

        const babySize = (comboType === 'mom_baby' || comboType === 'family' || comboType === 'baby_only') ? selectedBabySize : null;
        const finalSize = buildFinalSize();

        await addToCart(product.id, finalSize, selectedColor, comboType, quantity, babySize, buildProductData(), buildAddons());
        router.push('/checkout');
    };

    /**
     * Called by CustomisationForm when the customer fills their requirements and clicks "Buy Customised".
     * Validates size is selected (in the main product section above), embeds the full customisation note
     * into the product name so it appears in the order description in the admin panel.
     */
    const handleBuyCustomised = async (
        note: string,
        mobile: string,
        contactPref: "whatsapp" | "call"
    ) => {
        if (!validateSelections()) {
            toast.error("Please scroll up and select your size before buying the customised option.");
            return;
        }

        const babySize = (comboType === 'mom_baby' || comboType === 'family' || comboType === 'baby_only') ? selectedBabySize : null;
        const finalSize = buildFinalSize();

        // Embed the customisation note inside the product name snapshot.
        // This flows through to order_items.product_name → admin panel.
        const customProductData = {
            ...buildProductData(),
            name: `${product.name} ✂ CUSTOM — ${note}`,
        };

        await addToCart(product.id, finalSize, selectedColor, comboType, quantity, babySize, customProductData, buildAddons());
        toast.success("Customised order added! Proceeding to checkout…");
        router.push('/checkout');
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

    // Gallery follows the selected colour: show that colour's images plus any
    // untagged ones. Falls back to every image if the colour has none tagged.
    const displayImages = useMemo(() => {
        const all = product.images || [];
        if (!selectedColor) return all.map(img => img.image_url);

        const hasTaggedForColor = all.some(img => img.color === selectedColor);
        if (!hasTaggedForColor) return all.map(img => img.image_url);

        return all
            .filter(img => img.color === selectedColor || !img.color)
            .map(img => img.image_url);
    }, [product.images, selectedColor]);

    // Keep the main image inside the current colour's gallery
    useEffect(() => {
        if (displayImages.length > 0 && !displayImages.includes(activeImage)) {
            setActiveImage(displayImages[0]);
        }
    }, [displayImages, activeImage]);

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="container mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

                    {/* IMAGE GALLERY — sticky on desktop so the visuals stay with the options */}
                    <div className="w-full md:w-1/2 md:sticky md:top-28 md:self-start flex flex-col-reverse md:flex-row gap-4">
                        {displayImages.length > 1 && (
                            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide">
                                {displayImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        aria-label={`View image ${idx + 1}`}
                                        className={cn(
                                            "relative w-16 md:w-20 aspect-[3/4] rounded-md overflow-hidden flex-shrink-0 transition-all duration-200",
                                            activeImage === img
                                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                : "opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <Image src={img} alt={`${product.name} - Image ${idx + 1}`} fill sizes="80px" quality={70} className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 space-y-3">
                            <div className="relative aspect-[4/5] md:aspect-[3/4] bg-secondary/30 rounded-xl overflow-hidden group shadow-[var(--shadow-soft)]">
                                <AnimatePresence mode="wait">
                                    {activeImage ? (
                                        <motion.div
                                            key={activeImage}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={activeImage}
                                                alt={`${product.name} - ${categoryName} from Kurtis Boutique online store India`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                quality={80}
                                                priority
                                                fetchPriority="high"
                                                placeholder="blur"
                                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjUiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjUiIGZpbGw9IiNmMGU2ZWMiLz48L3N2Zz4="
                                                className="object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.06]"
                                            />
                                        </motion.div>
                                    ) : (
                                        <div className="absolute inset-0 bg-secondary flex items-center justify-center text-muted-foreground">
                                            <span>No Image Available</span>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {isDiscounted && (
                                    <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full shadow-sm">
                                        Save {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                    </span>
                                )}
                            </div>

                            {/* Mobile position dots */}
                            {displayImages.length > 1 && (
                                <div className="flex md:hidden justify-center gap-1.5">
                                    {displayImages.map((img, idx) => (
                                        <span
                                            key={idx}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all duration-300",
                                                activeImage === img ? "w-5 bg-primary" : "w-1.5 bg-border"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* DETAILS */}
                    <div className="w-full md:w-1/2 space-y-5 md:space-y-8">
                        <div>
                            <nav className="text-xs text-muted-foreground mb-3 md:mb-4 tracking-wide">
                                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                                <span className="mx-2 text-accent-brand">/</span>
                                <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
                                <span className="mx-2 text-accent-brand">/</span>
                                <span className="text-foreground/70 capitalize">{product.name}</span>
                            </nav>

                            <p className="text-[11px] uppercase tracking-[0.14em] text-accent-brand font-medium mb-2">{categoryName}</p>
                            <h1 className="text-[26px] leading-tight md:text-4xl font-serif text-foreground tracking-tight">{product.name}</h1>

                            {/* Price — the strongest element in the column */}
                            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <motion.span
                                    key={finalPrice}
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-3xl md:text-[34px] font-semibold text-foreground tabular-nums tracking-tight"
                                >
                                    {formatPrice(finalPrice)}
                                </motion.span>
                                {isDiscounted && (
                                    <>
                                        <span className="text-muted-foreground line-through text-lg tabular-nums">{formatPrice(originalPrice)}</span>
                                        <span className="text-success text-sm font-semibold">
                                            Save {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">Inclusive of all taxes</p>

                            {/* Trust row — social proof at the decision point */}
                            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground border-t border-border/70 pt-4">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="text-accent-brand">★★★★★</span>
                                    <span className="text-foreground/70 font-medium">30,000+ on Instagram</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 text-accent-brand" /> 7-day exchange
                                </span>
                                {inStock && (
                                    <span className="inline-flex items-center gap-1.5 text-success font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> In stock
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* COMBO TYPES — the main upsell surface, so options read as
                            offers rather than form choices. */}
                        {comboOptions.length > 1 && (
                            <div className="space-y-3">
                                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">Choose your set</span>
                                <div className="flex flex-col gap-2.5">
                                    {comboOptions.map(opt => {
                                        const active = comboType === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => setComboType(opt.id)}
                                                aria-pressed={active}
                                                className={cn(
                                                    "relative flex items-start gap-3 p-4 rounded-xl text-left border transition-all duration-200",
                                                    active
                                                        ? "border-primary bg-secondary/60 shadow-[var(--shadow-soft)]"
                                                        : "border-border bg-surface hover:border-primary/40 hover:bg-secondary/30"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                                                        active ? "border-primary" : "border-border"
                                                    )}
                                                >
                                                    {active && (
                                                        <motion.span
                                                            layoutId="combo-dot"
                                                            className="w-2.5 h-2.5 rounded-full bg-primary"
                                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                                        />
                                                    )}
                                                </span>

                                                <span className="flex flex-col min-w-0">
                                                    <span className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm text-foreground">{opt.label}</span>
                                                        {opt.badge && (
                                                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-accent-brand-soft text-accent-brand">
                                                                {opt.badge}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* BABY SIZE PICKER */}
                        {(comboType === 'mom_baby' || comboType === 'family' || comboType === 'baby_only') && product.baby_size_prices && product.baby_size_prices.length > 0 && (
                            <div id="baby-size-selector" className="mb-6 space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm">{comboType === 'mom_baby' && extraBabies.length > 0 ? 'Select Baby 1 Size' : 'Select Baby Size'}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {product.baby_size_prices.map(bp => (
                                            <button key={bp.id} onClick={() => setSelectedBabySize(bp.size)} className={cn("flex items-center justify-between p-3 border rounded-lg text-left transition-all", selectedBabySize === bp.size ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-primary/50")}>
                                                <span className="font-medium text-sm">{bp.size}</span>
                                                <span className="text-sm text-muted-foreground">{formatPrice(bp.price)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div id="baby-gender-selector">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm">{comboType === 'mom_baby' && extraBabies.length > 0 ? 'Select Baby 1 Gender' : 'Select Baby Gender'}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        {['Boy', 'Girl'].map(gender => (
                                            <button key={gender} onClick={() => setSelectedBabyGender(gender)} className={cn("flex-1 p-3 border rounded-lg text-center font-medium text-sm transition-all", selectedBabyGender === gender ? "border-primary ring-1 ring-primary bg-primary/5 text-primary" : "hover:border-primary/50 text-foreground")}>
                                                {gender}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ADDITIONAL BABIES (mom & baby combo only) */}
                                {comboType === 'mom_baby' && (
                                    <div className="space-y-4">
                                        {extraBabies.map((baby, index) => (
                                            <div key={index} className="p-3 border rounded-lg space-y-3 bg-muted/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-sm">Baby {index + 2}</span>
                                                    <button
                                                        onClick={() => setExtraBabies(extraBabies.filter((_, i) => i !== index))}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {product.baby_size_prices!.map(bp => (
                                                        <button
                                                            key={bp.id}
                                                            onClick={() => setExtraBabies(extraBabies.map((b, i) => i === index ? { ...b, size: bp.size } : b))}
                                                            className={cn("flex items-center justify-between p-2.5 border rounded-lg text-left transition-all", baby.size === bp.size ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-primary/50")}
                                                        >
                                                            <span className="font-medium text-sm">{bp.size}</span>
                                                            <span className="text-sm text-muted-foreground">{formatPrice(bp.price)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-3">
                                                    {['Boy', 'Girl'].map(gender => (
                                                        <button
                                                            key={gender}
                                                            onClick={() => setExtraBabies(extraBabies.map((b, i) => i === index ? { ...b, gender } : b))}
                                                            className={cn("flex-1 p-2.5 border rounded-lg text-center font-medium text-sm transition-all", baby.gender === gender ? "border-primary ring-1 ring-primary bg-primary/5 text-primary" : "hover:border-primary/50 text-foreground")}
                                                        >
                                                            {gender}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setExtraBabies([...extraBabies, { size: '', gender: '' }])}
                                            className="w-full p-3 border border-dashed rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add Another Baby
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* COLORS — selecting one also filters the gallery */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">Colour</span>
                                    {selectedColor && (
                                        <span className="text-xs text-foreground/70">
                                            {selectedColor.includes('|') ? selectedColor.split('|')[0] : selectedColor}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2.5 flex-wrap">
                                    {product.colors.map(colorStr => {
                                        const [name, hex] = colorStr.includes('|') ? colorStr.split('|') : [colorStr, '#cccccc'];
                                        const active = selectedColor === colorStr;
                                        return (
                                            <button
                                                key={colorStr}
                                                onClick={() => setSelectedColor(colorStr)}
                                                title={name}
                                                aria-label={`Colour: ${name}`}
                                                aria-pressed={active}
                                                className={cn(
                                                    "relative w-9 h-9 rounded-full transition-all duration-200 hover:scale-105",
                                                    active
                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                        : "ring-1 ring-border ring-offset-2 ring-offset-background hover:ring-primary/40"
                                                )}
                                                style={{ backgroundColor: hex }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SIZES */}
                        {comboType === 'baby_only' ? null : (comboType === 'family' || comboType === 'couple') ? (
                            <div id="family-sizes-selector" className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm">{comboType === 'couple' ? "Select Men's Size" : 'Select Father Size'}</span>
                                        <Link href="/size-chart" className="text-xs underline text-muted-foreground hover:text-primary transition-colors">Size Chart</Link>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {product.sizes?.map(sizeObj => (
                                            <button key={`father-${sizeObj.size}`} onClick={() => setSelectedFatherSize(sizeObj.size)} disabled={!inStock} className={cn("min-w-[46px] h-11 px-3 rounded-lg border text-sm font-medium flex items-center justify-center transition-all duration-200", selectedFatherSize === sizeObj.size ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-secondary/40", !inStock && "opacity-50 cursor-not-allowed")}>
                                                {sizeObj.size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm">{comboType === 'couple' ? "Select Women's Size" : 'Select Mother Size'}</span>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {product.sizes?.map(sizeObj => (
                                            <button key={`mother-${sizeObj.size}`} onClick={() => setSelectedMotherSize(sizeObj.size)} disabled={!inStock} className={cn("min-w-[46px] h-11 px-3 rounded-lg border text-sm font-medium flex items-center justify-center transition-all duration-200", selectedMotherSize === sizeObj.size ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-secondary/40", !inStock && "opacity-50 cursor-not-allowed")}>
                                                {sizeObj.size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div id="size-selector">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm">{comboType === 'mom_baby' ? 'Select Mom Size' : 'Select Size'}</span>
                                    <Link href="/size-chart" className="text-xs underline text-muted-foreground hover:text-primary transition-colors">Size Chart</Link>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {product.sizes?.map(sizeObj => (
                                        <button key={sizeObj.size} onClick={() => setSelectedSize(sizeObj.size)} disabled={!inStock} className={cn("min-w-[46px] h-11 px-3 rounded-lg border text-sm font-medium flex items-center justify-center transition-all duration-200", selectedSize === sizeObj.size ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-secondary/40", !inStock && "opacity-50 cursor-not-allowed")}>
                                            {sizeObj.size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CUSTOMISATION ADD-ONS */}
                        {addonsAllowed && product.addons && product.addons.length > 0 && (
                            <div className="space-y-2">
                                <span className="font-medium text-sm block">Customisation Add-ons</span>
                                <div className="flex flex-col gap-2">
                                    {product.addons.map(addon => {
                                        const isSelected = selectedAddonIds.includes(addon.id);
                                        return (
                                            <label key={addon.id} className={cn("flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all", isSelected ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-primary/50")}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={e => setSelectedAddonIds(e.target.checked
                                                            ? [...selectedAddonIds, addon.id]
                                                            : selectedAddonIds.filter(id => id !== addon.id))}
                                                        className="w-4 h-4 accent-primary"
                                                    />
                                                    <span className="font-medium text-sm">{addon.name}</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">+{formatPrice(addon.price)}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ACTIONS — Buy Now carries the visual weight; Add to Cart is
                            deliberately quieter so there is one obvious path forward. */}
                        <div ref={actionsRef} className="space-y-3 pt-5 border-t border-border">
                            {inStock && (
                                <Button
                                    size="lg"
                                    className="w-full h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-[var(--shadow-lift)] transition-all duration-300 text-[15px] font-semibold tracking-[0.08em] uppercase active:scale-[0.99] flex items-center gap-2"
                                    onClick={handleBuyNow}
                                >
                                    <Zap className="w-4 h-4" />
                                    Buy Now
                                </Button>
                            )}

                            <div className="flex items-center gap-2.5">
                                {/* Quantity */}
                                <div className="flex items-center border border-border rounded-full h-12 bg-surface">
                                    <button
                                        aria-label="Decrease quantity"
                                        className="px-3 h-full rounded-l-full hover:bg-secondary/60 transition-colors"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-9 text-center text-sm font-medium tabular-nums">{quantity}</span>
                                    <button
                                        aria-label="Increase quantity"
                                        className="px-3 h-full rounded-r-full hover:bg-secondary/60 transition-colors"
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Add to Cart */}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 h-12 rounded-full border-primary/30 bg-surface text-primary hover:bg-secondary hover:border-primary transition-all duration-200 text-sm font-semibold tracking-[0.06em] uppercase"
                                    onClick={handleAddToCart}
                                    disabled={!inStock}
                                >
                                    {inStock ? "Add to Cart" : "Out of Stock"}
                                </Button>

                                {/* Wishlist */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                    className={cn(
                                        "h-12 w-12 rounded-full flex-shrink-0 border-border bg-surface transition-colors",
                                        isWishlisted && "text-primary bg-secondary border-primary/30"
                                    )}
                                    onClick={toggleWishlist}
                                >
                                    <Heart className={cn("w-[18px] h-[18px]", isWishlisted && "fill-current")} />
                                </Button>
                            </div>
                        </div>

                        {/* DESCRIPTION BOX */}
                        {product.description && (
                            <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                                <button
                                    onClick={() => setDescOpen(prev => !prev)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                                >
                                    <span>Product Details</span>
                                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", descOpen && "rotate-180")} />
                                </button>
                                <AnimatePresence initial={false}>
                                    {descOpen && (
                                        <motion.div
                                            key="desc"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                                                {product.description}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* TRUST BADGES */}
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

                        <CustomisationForm
                            productId={product.id}
                            productName={product.name}
                            onBuyCustomised={handleBuyCustomised}
                        />
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
                            <div className="flex items-center gap-2 p-3 pl-4 rounded-2xl bg-surface/95 backdrop-blur-xl border border-border shadow-[var(--shadow-lift)]">
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-medium text-muted-foreground truncate">{product.name}</span>
                                    <span className="font-semibold text-base text-foreground tabular-nums">{formatPrice(finalPrice)}</span>
                                </div>
                                <Button
                                    className="h-11 px-4 rounded-full bg-surface border border-primary/30 text-primary text-sm font-semibold"
                                    variant="outline"
                                    onClick={() => {
                                        if (comboType === 'family' && (!selectedFatherSize || !selectedMotherSize)) {
                                            document.getElementById('family-sizes-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            toast.info("Please select both Father and Mother sizes");
                                        } else if (comboType !== 'family' && !selectedSize) {
                                            document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            toast.info("Please select a size");
                                        } else handleAddToCart();
                                    }}
                                    disabled={!inStock}
                                >
                                    {inStock ? "Add" : "No Stock"}
                                </Button>
                                <Button
                                    className="h-11 px-5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold flex items-center gap-1.5 shadow-[var(--shadow-soft)]"
                                    onClick={() => {
                                        if (comboType === 'family' && (!selectedFatherSize || !selectedMotherSize)) {
                                            document.getElementById('family-sizes-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            toast.info("Please select both Father and Mother sizes");
                                        } else if (comboType !== 'family' && !selectedSize) {
                                            document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            toast.info("Please select a size");
                                        } else handleBuyNow();
                                    }}
                                    disabled={!inStock}
                                >
                                    <Zap className="w-3 h-3" />
                                    Buy Now
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
