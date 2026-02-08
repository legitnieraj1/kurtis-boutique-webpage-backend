"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Mock Data - Admin Controlled Structure
const BANNERS = [
    {
        id: 1,
        text: "Maternity and Normal Wears",
        active: true,
    },
    {
        id: 2,
        text: "We Customise for You",
        active: true,
    },
    {
        id: 3,
        text: "Mom, Son & Daughter Combos",
        active: true,
    },
];

export function CarouselBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeBanners = BANNERS.filter((b) => b.active);

    useEffect(() => {
        if (activeBanners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        }, 4000); // Slow, elegant interval

        return () => clearInterval(interval);
    }, [activeBanners.length]);

    if (activeBanners.length === 0) return null;

    return (
        <div className="relative w-full max-w-[90%] md:max-w-md h-12 md:h-14 overflow-hidden rounded-full bg-white/40 backdrop-blur-md shadow-sm border border-white/50 flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeBanners[currentIndex].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1], // Apple-style ease-out curve
                    }}
                    className="absolute inset-0 flex items-center justify-center w-full h-full text-center px-4"
                >
                    <span className="text-sm md:text-base font-medium text-stone-700 tracking-wide whitespace-nowrap">
                        {activeBanners[currentIndex].text}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* Optional: Subtle indicators if needed, but keeping it minimal as per "promo strip" feel */}
        </div>
    );
}
