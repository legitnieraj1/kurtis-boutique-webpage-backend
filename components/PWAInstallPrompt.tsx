"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Mobile only — reliable CSS media query (not innerWidth which can be wrong at mount)
        const mobileQuery = window.matchMedia("(max-width: 767px)");
        if (!mobileQuery.matches) return;

        // Already installed as PWA — don't show
        if (window.matchMedia("(display-mode: standalone)").matches) return;

        // User already said "Not Now" — NEVER show again (localStorage persists forever)
        if (localStorage.getItem("kb_pwa_dismissed") === "1") return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowPrompt(true), 4000);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowPrompt(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Permanently dismissed — never show again on this device
        localStorage.setItem("kb_pwa_dismissed", "1");
    };

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    {/* Liquid Glass Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[201] w-[calc(100vw-32px)] max-w-sm"
                    >
                        {/* Glass card */}
                        <div
                            className="relative rounded-3xl overflow-hidden shadow-2xl"
                            style={{
                                background: "rgba(255,255,255,0.18)",
                                backdropFilter: "blur(32px) saturate(180%)",
                                WebkitBackdropFilter: "blur(32px) saturate(180%)",
                                border: "1px solid rgba(255,255,255,0.4)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6)",
                            }}
                        >
                            {/* Gradient shimmer overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(200,100,150,0.12) 100%)",
                                }}
                            />

                            <div className="relative p-6">
                                {/* Close button */}
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                    style={{
                                        background: "rgba(0,0,0,0.08)",
                                        backdropFilter: "blur(8px)",
                                    }}
                                    aria-label="Dismiss"
                                >
                                    <X className="w-4 h-4 text-gray-700" />
                                </button>

                                <div className="flex items-center gap-4 mb-5">
                                    {/* Logo */}
                                    <div
                                        className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg"
                                        style={{
                                            background: "rgba(255,255,255,0.7)",
                                            border: "1px solid rgba(255,255,255,0.8)",
                                        }}
                                    >
                                        <img
                                            src="/kurtis-logo-large.png"
                                            alt="Kurtis Boutique"
                                            className="w-full h-full object-contain p-1"
                                        />
                                    </div>

                                    <div>
                                        <h3
                                            className="font-bold text-lg leading-tight"
                                            style={{ color: "rgba(30,10,20,0.9)", textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}
                                        >
                                            Kurtis Boutique
                                        </h3>
                                        <p
                                            className="text-sm mt-0.5"
                                            style={{ color: "rgba(30,10,20,0.6)" }}
                                        >
                                            Designer Ethnic Wear
                                        </p>
                                    </div>
                                </div>

                                <p
                                    className="text-sm mb-6 leading-relaxed"
                                    style={{ color: "rgba(30,10,20,0.7)" }}
                                >
                                    Add Kurtis Boutique to your home screen for a faster, app-like experience — shop new arrivals, track orders & more.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
                                        style={{
                                            background: "rgba(0,0,0,0.07)",
                                            color: "rgba(30,10,20,0.65)",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        Not Now
                                    </button>
                                    <button
                                        onClick={handleInstall}
                                        className="flex-[2] py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        style={{
                                            background: "linear-gradient(135deg, #7d3b54, #c0527a)",
                                            color: "#fff",
                                            boxShadow: "0 4px 16px rgba(125,59,84,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                        Install App
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
