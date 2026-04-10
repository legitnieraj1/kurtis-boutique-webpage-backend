"use client";

import Link from "next/link";
import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function BottomNavbar() {
    const pathname = usePathname();
    const { isAuthenticated } = useStore();

    // Hide on admin / checkout pages
    const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");
    if (hidden) return null;

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/shop", icon: ShoppingBag, label: "Shop" },
        { href: "/wishlist", icon: Heart, label: "Wishlist" },
        { href: isAuthenticated ? "/account" : "/login?next=%2F", icon: User, label: "Profile" },
    ];

    return (
        <>
            {/* Bottom flat nav bar — mobile only */}
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/40 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
                aria-label="Bottom navigation"
            >
                <nav className="flex items-center justify-around px-2 py-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                aria-label={item.label}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
                                    "hover:bg-pink-50 active:scale-95",
                                    isActive && "bg-pink-50"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5 transition-all duration-200",
                                        isActive ? "text-primary scale-110" : "text-foreground/60"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold leading-none tracking-wide",
                                        isActive ? "text-primary" : "text-foreground/50"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom spacing so page content isn't hidden behind the bar */}
            <div className="md:hidden h-16" aria-hidden="true" />
        </>
    );
}
