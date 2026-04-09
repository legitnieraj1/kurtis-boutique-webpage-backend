"use client";

import Link from "next/link";
import { Home, ShoppingBag, Search, Heart, User } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchSheet } from "@/components/layout/SearchSheet";
import { useStore } from "@/lib/store";

export function BottomNavbar() {
    const pathname = usePathname();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { isAuthenticated } = useStore();

    // Hide on admin / checkout pages
    const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");
    if (hidden) return null;

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/shop", icon: ShoppingBag, label: "Shop" },
        { href: null, icon: Search, label: "Search", isCenter: true },
        { href: "/wishlist", icon: Heart, label: "Wishlist" },
        { href: isAuthenticated ? "/account" : "/login?next=%2F", icon: User, label: "Profile" },
    ];

    return (
        <>
            <SearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Bottom floating pill — mobile only */}
            <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4" aria-label="Bottom navigation">
                <nav
                    className="flex w-full max-w-sm items-center justify-between rounded-full px-3 py-2"
                    style={{
                        background: "linear-gradient(135deg, #fde2e4 0%, #fbbfd4 40%, #f9a8d4 70%, #f472b6 100%)",
                        boxShadow: "0 8px 32px rgba(236,72,153,0.25), 0 2px 8px rgba(236,72,153,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
                        border: "1px solid rgba(255,255,255,0.5)",
                    }}
                >
                    {navItems.map((item) => {
                        const isActive = item.href ? pathname === item.href : false;
                        const Icon = item.icon;

                        if (item.isCenter) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label="Search"
                                    className={cn(
                                        "relative flex items-center justify-center rounded-full transition-all duration-300",
                                        "w-13 h-13 -mt-3 shadow-lg",
                                        "bg-gradient-to-br from-pink-500 to-rose-500",
                                        "hover:scale-110 hover:shadow-pink-300/60 active:scale-95",
                                        "border-2 border-white/40"
                                    )}
                                    style={{
                                        width: "52px",
                                        height: "52px",
                                        marginTop: "-12px",
                                        boxShadow: "0 6px 20px rgba(236,72,153,0.5), 0 2px 6px rgba(236,72,153,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                                    }}
                                >
                                    <Icon className="h-5 w-5 text-white drop-shadow-sm" />
                                </button>
                            );
                        }

                        const content = (
                            <div
                                className={cn(
                                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition-all duration-200",
                                    "hover:bg-white/30 active:scale-95",
                                    isActive && "bg-white/40"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-[18px] w-[18px] transition-all duration-200",
                                        isActive ? "text-pink-800 scale-110" : "text-pink-700"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-[9px] font-semibold tracking-wide leading-none",
                                        isActive ? "text-pink-800" : "text-pink-600/90"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </div>
                        );

                        return item.href ? (
                            <Link key={item.label} href={item.href} aria-label={item.label}>
                                {content}
                            </Link>
                        ) : (
                            <button key={item.label} aria-label={item.label}>
                                {content}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom spacing — mobile only so it doesn't push desktop content */}
            <div className="md:hidden h-24" aria-hidden="true" />
        </>
    );
}
