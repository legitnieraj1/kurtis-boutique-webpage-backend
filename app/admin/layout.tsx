"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, LogOut, Images, ShoppingBag, MessageSquareQuote, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { NotificationBell } from "@/components/admin/NotificationBell";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useStore();
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // Protect admin routes
    useEffect(() => {
        if (mounted && pathname !== "/admin/login") {
            if (!user || user.role !== "admin") {
                router.replace("/admin/login");
            }
        }
    }, [user, pathname, router, mounted]);

    // Don't render anything until mounted to prevent hydration mismatch
    // or if verifying auth for protected routes
    if (!mounted) return null;

    // Login page should not have the sidebar
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    // If trying to access admin routes without auth, don't render layout content
    // validation is handled by useEffect above
    if (!user || user.role !== "admin") return null;

    const navItems = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/banners", label: "Banners", icon: Images },
        { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
        { href: "/admin/customisation-queries", label: "Customisation", icon: MessageSquareQuote },
    ];

    return (
        <div className="flex min-h-screen bg-muted/20 text-foreground font-sans bg-[#faf9f6]">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-40 flex items-center justify-between px-4">
                <span className="font-serif text-xl font-bold">KB Admin</span>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-muted rounded-md"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "w-64 border-r border-border bg-white flex flex-col fixed md:sticky top-0 h-screen z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <span className="font-serif text-xl font-bold">KB Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={() => {
                            useStore.getState().logout();
                            router.push("/admin/login");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-stone-50/50">
                {/* Desktop Top Bar */}
                <div className="hidden md:flex h-16 bg-white border-b border-stone-200 items-center justify-end px-8 sticky top-0 z-30">
                    <NotificationBell />
                </div>

                <div className="pt-16 md:pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
