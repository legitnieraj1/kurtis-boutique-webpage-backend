"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, ShoppingBag, Heart, LogOut, ChevronRight, Mail, Shield } from "lucide-react";
import { useStore } from "@/lib/store";

export default function AccountPage() {
    const { user, isAuthenticated, isLoading, logout } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?next=/account");
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogout = async () => {
        logout();
        router.push("/");
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
            </div>
        );
    }

    const initials = user.full_name
        ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : user.email.slice(0, 2).toUpperCase();

    const menuItems = [
        {
            icon: ShoppingBag,
            label: "My Orders",
            description: "Track, return or buy again",
            href: "https://www.kurtisboutique.in/orders",
            external: true,
        },
        {
            icon: Heart,
            label: "My Wishlist",
            description: "Items you've saved for later",
            href: "/wishlist",
            external: false,
        },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-white to-[#fef0f4] pb-32">
            {/* Hero / Avatar Section */}
            <div className="relative overflow-hidden">
                {/* Background blobs */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(244,114,182,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 90% 30%, rgba(251,191,212,0.15) 0%, transparent 60%)",
                    }}
                />

                <div className="relative z-10 flex flex-col items-center pt-16 pb-10 px-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                            style={{
                                background:
                                    "linear-gradient(135deg, #f472b6 0%, #e11d48 100%)",
                                boxShadow:
                                    "0 8px 32px rgba(244,114,182,0.40), 0 2px 8px rgba(225,29,72,0.20)",
                            }}
                        >
                            {initials}
                        </div>
                        <div
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                                boxShadow: "0 2px 8px rgba(251,191,36,0.40)",
                            }}
                        >
                            <Shield className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>

                    {/* Name & Email */}
                    <h1
                        className="mt-4 text-2xl font-bold tracking-tight text-center"
                        style={{ fontFamily: "var(--font-serif, serif)", color: "#1a1a2e" }}
                    >
                        {user.full_name || "My Account"}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5 text-pink-400" />
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    {/* Pill badge */}
                    <span
                        className="mt-3 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest"
                        style={{
                            background: "linear-gradient(90deg, #fce7f3 0%, #fdf2f8 100%)",
                            color: "#be185d",
                            border: "1px solid rgba(251,207,232,0.8)",
                        }}
                    >
                        {user.role === "admin" ? "Admin" : "Member"}
                    </span>
                </div>
            </div>

            {/* Account Info Card */}
            <div className="px-4 max-w-md mx-auto space-y-4">
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(244,114,182,0.15)",
                        boxShadow: "0 4px 24px rgba(244,114,182,0.08)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <div className="px-5 py-4 border-b border-pink-50">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-pink-400">
                            Account Details
                        </p>
                    </div>
                    <div className="divide-y divide-pink-50/60">
                        <div className="flex items-center gap-3 px-5 py-4">
                            <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-pink-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Full Name</p>
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {user.full_name || "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4">
                            <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-pink-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Email</p>
                                <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(244,114,182,0.15)",
                        boxShadow: "0 4px 24px rgba(244,114,182,0.08)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <div className="px-5 py-4 border-b border-pink-50">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-pink-400">
                            Quick Links
                        </p>
                    </div>
                    <div className="divide-y divide-pink-50/60">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const inner = (
                                <div className="flex items-center gap-3 px-5 py-4 hover:bg-pink-50/50 transition-colors duration-200 cursor-pointer group">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)",
                                        }}
                                    >
                                        <Icon className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                        <p className="text-xs text-gray-400">{item.description}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-pink-300 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                            );

                            return item.external ? (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {inner}
                                </a>
                            ) : (
                                <Link key={item.label} href={item.href}>
                                    {inner}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-95"
                    style={{
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(244,114,182,0.2)",
                        color: "#e11d48",
                        boxShadow: "0 4px 24px rgba(244,114,182,0.06)",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,241,245,0.95)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.85)";
                    }}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </main>
    );
}
