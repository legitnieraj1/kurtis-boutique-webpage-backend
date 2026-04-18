"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { CartSheet } from "@/components/cart/CartSheet";
import { SearchSheet } from "@/components/layout/SearchSheet";

const links = [
    { href: "/", label: "Home", title: "Kurtis Boutique - Designer Kurtis Online Store India" },
    { href: "/shop", label: "Shop", title: "Shop Designer Kurtis & Ethnic Wear Online India" },
    { href: "/contact", label: "Contact", title: "Contact Kurtis Boutique India" },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { cart, isCartOpen, setIsCartOpen, syncCart } = useStore();

    useEffect(() => {
        setMounted(true);
        // Load cart from localStorage on mount
        syncCart();
    }, [syncCart]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-24 items-center justify-between relative">

                        {/* MOBILE LEFT: Search */}
                        <div className="flex items-center gap-1 md:hidden z-40">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSearchOpen(true)}
                                aria-label="Search"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* LOGO — centered on mobile, left on desktop */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 z-50 flex items-center">
                            <Link href="/" title="Kurtis Boutique - Designer Kurtis Online Store India">
                                <img
                                    src="/kurtis-logo-large.png"
                                    alt="Kurtis Boutique - Designer Kurtis Online Store India"
                                    className="h-28 md:h-40 w-auto object-contain drop-shadow-sm md:transform md:-translate-x-2 pb-2 md:pb-0 scale-125 md:scale-100"
                                />
                            </Link>
                        </div>

                        {/* DESKTOP NAV */}
                        <nav className="hidden md:flex items-center gap-8 ml-60" aria-label="Main navigation">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    title={link.title}
                                    className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* RIGHT ICONS */}
                        <div className="flex items-center gap-2 md:gap-4 z-40">
                            {/* Search: desktop only */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Search className="h-5 w-5" />
                            </Button>

                            {/* Wishlist: desktop only */}
                            <Link href="/wishlist" className="hidden md:flex">
                                <Button variant="ghost" size="icon" aria-label="Wishlist">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </Link>

                            {/* Cart: all screens */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                onClick={() => setIsCartOpen(true)}
                                aria-label="Open cart"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>

                            {/* Hamburger: mobile only */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setIsOpen(!isOpen)}
                                aria-label="Open menu"
                            >
                                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MOBILE SLIDE-IN MENU */}
                <div className={cn(
                    "fixed inset-0 z-[100] bg-background transform transition-transform duration-300 ease-in-out md:hidden flex flex-col mobile-gpu",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="h-24 flex items-center justify-between px-6 border-b border-border/40">
                        <span className="font-serif text-2xl font-medium tracking-wide">Menu</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <nav className="flex-1 flex flex-col p-8 space-y-6 overflow-y-auto">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-3xl font-serif font-medium text-foreground hover:text-primary transition-colors block"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-8 border-t border-border/40 mt-4 space-y-4">
                            <Link
                                href="/wishlist"
                                onClick={() => setIsOpen(false)}
                                className="text-lg font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
                            >
                                <Heart className="w-5 h-5" /> Wishlist
                            </Link>
                            <button
                                onClick={() => { setIsOpen(false); setIsCartOpen(true); }}
                                className="text-lg font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" /> Cart {mounted && cartCount > 0 && `(${cartCount})`}
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <SearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
