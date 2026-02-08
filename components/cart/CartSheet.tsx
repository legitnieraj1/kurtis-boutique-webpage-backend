"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { createPortal } from "react-dom";

interface CartSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
    const { cart, removeFromCart, updateCartQuantity, getCartTotal, isAuthenticated, cartLoading } = useStore();
    const isMobile = useIsMobile();
    const [hydrated, setHydrated] = useState(false);
    const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        setHydrated(true);
    }, []);

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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={isMobile ? { type: "tween", duration: 0.3 } : { type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-[100dvh] w-full sm:w-[500px] bg-background shadow-2xl z-[101] flex flex-col mobile-gpu"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-2xl font-serif">Shopping Bag ({cart.length})</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {!isAuthenticated ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-medium">Please login to view your cart</h3>
                                    <p className="text-muted-foreground">Your cart is synced across devices when logged in.</p>
                                    <Link href="/login" onClick={onClose}>
                                        <Button className="mt-4">Login</Button>
                                    </Link>
                                </div>
                            ) : cartLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <p className="text-muted-foreground">Loading your cart...</p>
                                </div>
                            ) : cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-medium">Your bag is empty</h3>
                                    <p className="text-muted-foreground">Looks like you haven't added anything yet.</p>
                                    <Button onClick={onClose} className="mt-4">Start Shopping</Button>
                                </div>
                            ) : (
                                cart.map((item) => {
                                    const isUpdating = updatingItems.has(item.id);
                                    const imageUrl = item.product?.images?.[0]?.image_url;
                                    const price = item.product?.discount_price || item.product?.price || 0;

                                    return (
                                        <div key={item.id} className={`flex gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 ${isUpdating ? 'opacity-50' : ''}`}>
                                            <div className="relative w-24 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0 border border-border">
                                                {imageUrl ? (
                                                    <Image
                                                        src={imageUrl}
                                                        alt={item.product?.name || 'Product'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                                                        <span className="text-xs text-stone-500">No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-medium text-base leading-tight line-clamp-2">
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
                                                    <p className="text-sm text-muted-foreground mt-1">Size: {item.size}</p>
                                                    <p className="font-medium mt-1">{formatPrice(price)}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border border-border rounded-md bg-background">
                                                        <button
                                                            className="p-1 hover:bg-muted transition-colors rounded-l-md"
                                                            disabled={isUpdating || item.quantity <= 1}
                                                            onClick={() => {
                                                                if (item.quantity > 1) {
                                                                    handleUpdateQuantity(item.id, item.quantity - 1);
                                                                }
                                                            }}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                        <button
                                                            className="p-1 hover:bg-muted transition-colors rounded-r-md"
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
                        {isAuthenticated && cart.length > 0 && (
                            <div className="p-6 border-t border-border space-y-4 bg-background">
                                <div className="flex items-center justify-between text-lg">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Shipping calculated at checkout</p>
                                <Button
                                    className="w-full h-14 rounded-full bg-gradient-to-r from-primary via-rose-600 to-primary bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 text-base font-bold tracking-widest uppercase"
                                    asChild
                                >
                                    <Link href="/checkout" onClick={onClose}>
                                        Proceed to Checkout
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={onClose}
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
