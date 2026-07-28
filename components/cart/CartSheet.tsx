"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { getCartItemPrice } from "@/lib/cartService";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { createPortal } from "react-dom";

interface CartSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 999;

const COMBO_LABELS: Record<string, string> = {
    mom_baby: 'Mom & Baby Combo',
    family: 'Family Combo',
    couple: 'Couples Combo',
    baby_only: 'Baby Only',
};

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
    const { cart, removeFromCart, updateCartQuantity, getCartTotal } = useStore();
    const isMobile = useIsMobile();
    const [hydrated, setHydrated] = useState(false);
    const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        setHydrated(true);
    }, []);

    // Lock body scroll when cart is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!hydrated) return null;

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        setUpdatingItems(prev => new Set(prev).add(cartItemId));
        await updateCartQuantity(cartItemId, newQuantity);
        setUpdatingItems(prev => {
            const next = new Set(prev);
            next.delete(cartItemId);
            return next;
        });
    };

    const handleRemove = async (cartItemId: string) => {
        setUpdatingItems(prev => new Set(prev).add(cartItemId));
        await removeFromCart(cartItemId);
        setUpdatingItems(prev => {
            const next = new Set(prev);
            next.delete(cartItemId);
            return next;
        });
    };

    const subtotal = getCartTotal();
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-foreground/40 z-[100] backdrop-blur-[2px]"
                    />

                    {/* Drawer — smooth spring slide */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={
                            isMobile
                                ? { type: "tween", duration: 0.32, ease: [0.32, 0.72, 0, 1] }
                                : { type: "spring", stiffness: 320, damping: 32 }
                        }
                        className="fixed right-0 top-0 h-[100dvh] w-full sm:w-[440px] bg-background shadow-[var(--shadow-lift)] z-[101] flex flex-col mobile-gpu"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                            <h2 className="text-xl font-serif text-foreground">
                                Your Bag
                                <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">
                                    ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                                </span>
                            </h2>
                            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close bag">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Free-shipping progress — turns the existing threshold into an
                            active nudge instead of a footnote under the total. */}
                        {cart.length > 0 && (
                            <div className="px-6 py-3.5 bg-secondary/50 border-b border-border flex-shrink-0">
                                {remainingForFreeShipping > 0 ? (
                                    <p className="text-xs text-foreground/80">
                                        Add <span className="font-semibold text-primary">{formatPrice(remainingForFreeShipping)}</span> more for free shipping
                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-success">You&apos;ve unlocked free shipping</p>
                                )}
                                <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-accent-brand"
                                        initial={false}
                                        animate={{ width: `${shippingProgress}%` }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-medium">Your bag is empty</h3>
                                    <p className="text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
                                    <Button onClick={onClose} className="mt-4">Start Shopping</Button>
                                </div>
                            ) : (
                                cart.map((item) => {
                                    const isUpdating = updatingItems.has(item.id);
                                    const imageUrl = item.product?.images?.[0]?.image_url;
                                    const price = getCartItemPrice(item);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex gap-4 p-3 bg-surface rounded-xl border border-border transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
                                        >
                                            <div className="relative w-[88px] h-[116px] bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                {imageUrl ? (
                                                    <Image
                                                        src={imageUrl}
                                                        alt={item.product?.name || 'Product'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                                                        <ShoppingBag className="h-8 w-8 text-stone-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-serif text-[15px] leading-snug text-foreground line-clamp-2">
                                                            {item.product?.name || "Product"}
                                                        </h3>
                                                        <button
                                                            onClick={() => handleRemove(item.id)}
                                                            disabled={isUpdating}
                                                            className="text-muted-foreground hover:text-red-500 transition-colors p-1 -mr-2 -mt-2"
                                                        >
                                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {item.combo_type && item.combo_type !== 'single' && COMBO_LABELS[item.combo_type] && (
                                                            <span className="text-[11px] font-medium text-primary bg-secondary px-2 py-0.5 rounded-full">
                                                                {COMBO_LABELS[item.combo_type]}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                            {item.size}
                                                        </span>
                                                        {item.color && (
                                                            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                                {item.color.includes('|') ? item.color.split('|')[0] : item.color}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold mt-2 tabular-nums text-foreground">{formatPrice(price)}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border border-border rounded-full bg-surface">
                                                        <button
                                                            className="px-2.5 py-1.5 hover:bg-secondary/60 transition-colors rounded-l-full disabled:opacity-40"
                                                            disabled={isUpdating || item.quantity <= 1}
                                                            onClick={() => item.quantity > 1 && handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                                                        <button
                                                            className="px-2.5 py-1.5 hover:bg-secondary/60 transition-colors rounded-r-full disabled:opacity-40"
                                                            disabled={isUpdating}
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="px-6 py-5 border-t border-border space-y-3.5 bg-surface flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Subtotal</span>
                                    <span className="text-xl font-semibold tabular-nums text-foreground">{formatPrice(subtotal)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground -mt-1">Shipping calculated at checkout · Inclusive of all taxes</p>

                                <Button
                                    className="w-full h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-[var(--shadow-lift)] transition-all duration-300 text-[15px] font-semibold tracking-[0.08em] uppercase active:scale-[0.99] gap-2"
                                    asChild
                                >
                                    <Link href="/checkout" onClick={onClose}>
                                        Proceed to Checkout
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                                >
                                    Continue shopping
                                </button>

                                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                                    Secure checkout · Razorpay · UPI, Cards &amp; more
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
