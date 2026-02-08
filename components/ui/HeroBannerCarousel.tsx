"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/use-mobile";

interface Banner {
    id: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
    display_order: number;
}

export function HeroBannerCarousel() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const isMobile = useIsMobile();

    // Fetch banners from API
    useEffect(() => {
        async function fetchBanners() {
            try {
                const res = await fetch('/api/banners');
                if (res.ok) {
                    const data = await res.json();
                    setBanners(data.banners?.filter((b: Banner) => b.is_active) || []);
                }
            } catch (error) {
                console.error('Failed to fetch banners:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBanners();
    }, []);

    const activeBanners = banners;

    // Auto-slide logic
    useEffect(() => {
        if (activeBanners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [activeBanners.length]);

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    };

    if (loading) {
        return (
            <div className="w-full aspect-[21/9] bg-stone-100 animate-pulse flex items-center justify-center">
                <span className="text-stone-400">Loading...</span>
            </div>
        );
    }

    if (activeBanners.length === 0) {
        return (
            <div className="w-full aspect-[21/9] bg-gradient-to-r from-rose-100 to-stone-100 flex items-center justify-center">
                <span className="text-stone-500 text-lg">No banners available</span>
            </div>
        );
    }

    return (
        <motion.div
            className="relative w-full h-full overflow-hidden group mobile-gpu"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.05}
            onDragEnd={(e, { offset }) => {
                const swipe = offset.x;
                if (Math.abs(swipe) > 50) {
                    if (swipe > 0) {
                        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
                    } else {
                        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
                    }
                }
            }}
        >
            <AnimatePresence initial={false}>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Link href={activeBanners[currentIndex]?.link_url || "/"} className="block w-full h-full">
                        {activeBanners[currentIndex]?.image_url ? (
                            <img
                                src={activeBanners[currentIndex].image_url}
                                alt="Banner"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-rose-100 to-stone-100 flex items-center justify-center">
                                <span className="text-stone-400">No Image</span>
                            </div>
                        )}
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {activeBanners.length > 1 && !isMobile && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dots */}
            {activeBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    {activeBanners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
