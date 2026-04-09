"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { CartSheet } from "@/components/cart/CartSheet";
import { SearchSheet } from "@/components/layout/SearchSheet";
import { usePathname } from "next/navigation";

const links = [
    { href: "/", label: "Home", title: "Kurtis Boutique - Designer Kurtis Online Store India" },
    { href: "/shop", label: "Shop", title: "Shop Designer Kurtis & Ethnic Wear Online India" },
    { href: "/orders", label: "Orders", title: "Track Your Orders - Kurtis Boutique" },
    { href: "/contact", label: "Contact", title: "Contact Kurtis Boutique India" },
];

export function Navbar() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { cart, user, logout } = useStore();
    const [mounted, setMounted] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setIsAccountOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const handleLogout = () => { logout(); setIsAccountOpen(false); };
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
    const loginHref = isAuthPage ? '/login' : `/login?next=${encodeURIComponent(pathname || '/')}`;

    return (
        <>
            {/* ══════════════════════════════════════════════
                DESKTOP NAVBAR — sticky flat bar (md and up)
            ══════════════════════════════════════════════ */}
            <header className="hidden md:block sticky top-0 z-50 w-full border-b border-border/40 bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-24 items-center justify-between relative">

                        {/* Logo — absolute-centered but sits left via original approach */}
                        <Link
                            href="/"
                            className="absolute top-1/2 -translate-y-1/2 z-50 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0"
                            title="Kurtis Boutique - Designer Kurtis Online Store India"
                        >
                            <img
                                src="/kurtis-logo-large.png"
                                alt="Kurtis Boutique - Designer Kurtis Online Store India"
                                className="h-40 w-auto object-contain drop-shadow-sm md:transform md:-translate-x-2"
                            />
                        </Link>

                        {/* Nav links */}
                        <nav className="flex items-center gap-8 ml-60" aria-label="Main navigation">
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

                        {/* Right icons */}
                        <div className="flex items-center gap-4 z-40">
                            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                                <Search className="h-5 w-5" />
                            </Button>

                            {mounted && user ? (
                                <div className="relative" ref={accountRef}>
                                    <button
                                        onClick={() => setIsAccountOpen(!isAccountOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-secondary/50 transition-colors"
                                    >
                                        <UserIcon className="h-5 w-5" />
                                        <span className="text-sm font-medium hidden lg:inline-block max-w-[120px] truncate">
                                            {user.full_name || user.email}
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", isAccountOpen && "rotate-180")} />
                                    </button>
                                    {isAccountOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-border/50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-border/40">
                                                <p className="text-sm font-medium text-foreground truncate">{user.full_name || 'Account'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                            <Link href="/account" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors">
                                                My Profile
                                            </Link>
                                            <Link href="/orders" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors">
                                                My Orders
                                            </Link>
                                            <Link href="/wishlist" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors">
                                                Wishlist
                                            </Link>
                                            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href={loginHref}>
                                    <Button variant="ghost" size="sm" className="font-medium">Login</Button>
                                </Link>
                            )}

                            <Link href="/wishlist">
                                <Button variant="ghost" size="icon">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </Link>

                            <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
                                <ShoppingBag className="h-5 w-5" />
                                <span className="sr-only">Cart</span>
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════════
                MOBILE NAVBAR — floating pill (below md)
                Rendered AFTER desktop so it's in a separate
                stacking context and never overlaps desktop.
            ══════════════════════════════════════════════ */}
            <div className="md:hidden">
                {/* Fixed pill */}
                <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 pointer-events-none">
                    <div className={cn(
                        "pointer-events-auto w-full max-w-sm flex items-center justify-between px-5 h-16 rounded-full transition-all duration-300",
                        "bg-gradient-to-r from-[#fdf2f5] via-[#fce7f0] to-[#fdf2f5]",
                        "border border-pink-200/70",
                        scrolled
                            ? "shadow-[0_8px_32px_rgba(236,72,153,0.15)] backdrop-blur-xl"
                            : "shadow-[0_4px_24px_rgba(236,72,153,0.10)] backdrop-blur-md"
                    )}>
                        {/* LEFT: Cart */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-100/70 transition-all duration-200 group"
                            aria-label="Open cart"
                        >
                            <ShoppingBag className="h-[18px] w-[18px] text-pink-700 group-hover:scale-110 transition-transform duration-200" />
                            {mounted && cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-pink-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* CENTER: Logo */}
                        <Link
                            href="/"
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            title="Kurtis Boutique"
                        >
                            <img
                                src="/kurtis-logo-large.png"
                                alt="Kurtis Boutique"
                                className="h-12 w-auto object-contain drop-shadow-sm"
                            />
                        </Link>
                    </div>
                </div>

                {/* Spacer so page content sits below the fixed pill */}
                <div className="h-[76px]" aria-hidden="true" />
            </div>

            <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <SearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
