"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
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
    const [isOpen, setIsOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const { cart, user, logout } = useStore();
    const [mounted, setMounted] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => { setMounted(true); }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setIsAccountOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const handleLogout = () => { logout(); setIsAccountOpen(false); };
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
    const loginHref = isAuthPage ? '/login' : `/login?next=${encodeURIComponent(pathname || '/')}`;

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-24 items-center justify-between relative">

                        {/* ── MOBILE LEFT: Heart icon ── */}
                        <div className="flex items-center gap-1 md:hidden z-40">
                            <Link href="/wishlist">
                                <Button variant="ghost" size="icon">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>

                        {/* ── LOGO — centered on mobile, left on desktop ── */}
                        <Link
                            href="/"
                            className="absolute top-1/2 -translate-y-1/2 z-50 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0"
                            title="Kurtis Boutique - Designer Kurtis Online Store India"
                        >
                            <img
                                src="/kurtis-logo-large.png"
                                alt="Kurtis Boutique - Designer Kurtis Online Store India"
                                className="h-28 md:h-40 w-auto object-contain drop-shadow-sm md:transform md:-translate-x-2 pb-2 md:pb-0 scale-125 md:scale-100"
                            />
                        </Link>

                        {/* ── MOBILE SEARCH ICON — sits right next to the logo ── */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            aria-label="Search"
                            className="md:hidden absolute left-1/2 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-8 h-8 rounded-full hover:bg-pink-50 transition-colors"
                            style={{ marginLeft: "85px" }}
                        >
                            <Search className="h-[20px] w-[20px] text-foreground/80" />
                        </button>

                        {/* ── DESKTOP NAV ── */}
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

                        {/* ── RIGHT ICONS ── */}
                        <div className="flex items-center gap-2 md:gap-4 z-40">
                            {/* Search: Desktop only */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Search className="h-5 w-5" />
                            </Button>

                            {/* User / Login: Desktop only */}
                            {mounted && user ? (
                                <div className="hidden md:block relative" ref={accountRef}>
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
                                <Link href={loginHref} className="hidden md:block">
                                    <Button variant="ghost" size="sm" className="font-medium">Login</Button>
                                </Link>
                            )}

                            {/* Wishlist: Desktop only */}
                            <Link href="/wishlist" className="hidden md:flex">
                                <Button variant="ghost" size="icon">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </Link>

                            {/* Cart: All screens */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                onClick={() => setIsCartOpen(true)}
                            >
                                <ShoppingBag className="h-5 w-5" />
                                <span className="sr-only">Cart</span>
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>

                            {/* Hamburger: Mobile only */}
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

                {/* ── MOBILE SLIDE-IN MENU ── */}
                <div className={cn(
                    "fixed inset-0 z-[100] bg-background transform transition-transform duration-300 ease-in-out md:hidden flex flex-col mobile-gpu",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    {/* Header */}
                    <div className="h-24 flex items-center justify-between px-6 border-b border-border/40">
                        <span className="font-serif text-2xl font-medium tracking-wide">Menu</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Links */}
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
                            {!user ? (
                                <Link
                                    href={loginHref}
                                    onClick={() => setIsOpen(false)}
                                    className="text-lg font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
                                >
                                    <UserIcon className="w-5 h-5" /> Login / Sign Up
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/account"
                                        onClick={() => setIsOpen(false)}
                                        className="text-lg font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
                                    >
                                        <UserIcon className="w-5 h-5" /> My Profile
                                    </Link>
                                    <button
                                        onClick={() => { logout(); setIsOpen(false); }}
                                        className="text-lg font-medium text-muted-foreground hover:text-red-500 flex items-center gap-2"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <SearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
