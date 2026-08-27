"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { MOBILE_BREAKPOINT, bannersForDevice, type BannerDeviceType } from "@/lib/banners";

interface Banner {
    id: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
    display_order: number;
    device_type?: BannerDeviceType | null;
}

type Variant = "desktop" | "mobile";

/** Shape of the box until the first banner reports its real proportions.
 *  Only ever visible for the instant before the image's dimensions are known. */
const FALLBACK_ASPECT = 16 / 9;

/** A portrait banner would otherwise push the rest of the page off several
 *  screens, so the desktop box stops growing here. Past this point — and only
 *  past it — the image letterboxes rather than crops. */
const MAX_ASPECT_HEIGHT_VH = 88;

/** Each variant is rendered for both devices and hidden with CSS, so the server
 *  never has to know the device. `sizes` collapses to 1px on the viewport that
 *  cannot see the carousel, which keeps the browser from downloading a
 *  full-resolution image it will never show. */
const SIZES: Record<Variant, string> = {
    desktop: `(min-width: ${MOBILE_BREAKPOINT}px) 100vw, 1px`,
    mobile: `(max-width: ${MOBILE_BREAKPOINT - 1}px) 100vw, 1px`,
};

export function HeroBannerCarousel({
    initialBanners,
    variant = "desktop",
}: {
    initialBanners?: Banner[];
    variant?: Variant;
}) {
    const [banners, setBanners] = useState<Banner[]>(initialBanners || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(!initialBanners);
    // Natural width/height ratio of each banner, keyed by image URL. Desktop
    // only: the box takes the image's own proportions so nothing is cropped.
    // Mobile banners are a fixed 9:16 and fill the screen instead.
    const [aspects, setAspects] = useState<Record<string, number>>({});
    // Whether this variant's breakpoint is the one currently on screen. Drives
    // effects only — never markup — so it cannot cause a hydration mismatch.
    const [isVisible, setIsVisible] = useState(false);

    const isMobileVariant = variant === "mobile";

    useEffect(() => {
        const query = isMobileVariant
            ? `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
            : `(min-width: ${MOBILE_BREAKPOINT}px)`;
        const mql = window.matchMedia(query);
        const update = () => setIsVisible(mql.matches);
        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, [isMobileVariant]);

    useEffect(() => {
        if (initialBanners) return; // Skip fetch if passed via props
        let cancelled = false;
        async function fetchBanners() {
            try {
                const res = await fetch('/api/banners');
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setBanners(data.banners || []);
                }
            } catch (error) {
                console.error('Failed to fetch banners:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchBanners();
        return () => { cancelled = true; };
    }, [initialBanners]);

    // Banners targeted at this variant, plus the untargeted ('all') ones.
    const activeBanners = React.useMemo(
        () => bannersForDevice(banners.filter(b => b.is_active), variant)
            .slice()
            .sort((a, b) => a.display_order - b.display_order),
        [banners, variant],
    );

    // A banner removed from the set must not leave the index pointing past the
    // end of the list.
    useEffect(() => {
        setCurrentIndex(prev => (prev >= activeBanners.length ? 0 : prev));
    }, [activeBanners.length]);

    // Read each banner's natural proportions once. Preloading rather than
    // waiting for the <Image> onLoad means the box is already the right shape
    // when the picture appears, so nothing jumps. Skipped for the mobile
    // variant (fixed shape) and while this variant is off screen.
    useEffect(() => {
        if (isMobileVariant || !isVisible) return;
        activeBanners.forEach(banner => {
            if (!banner.image_url || aspects[banner.image_url]) return;
            const probe = new window.Image();
            probe.onload = () => {
                if (!probe.naturalWidth || !probe.naturalHeight) return;
                setAspects(prev => prev[banner.image_url]
                    ? prev
                    : { ...prev, [banner.image_url]: probe.naturalWidth / probe.naturalHeight });
            };
            probe.src = banner.image_url;
        });
    }, [activeBanners, aspects, isMobileVariant, isVisible]);

    const currentUrl = activeBanners[currentIndex]?.image_url;
    const currentAspect = (currentUrl && aspects[currentUrl]) || FALLBACK_ASPECT;

    // Auto-slide logic — paused while this variant is hidden.
    useEffect(() => {
        if (activeBanners.length <= 1 || !isVisible) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [activeBanners.length, isVisible]);

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

    // The mobile banner is a 9:16 portrait that fills the phone screen in both
    // directions; the desktop banner keeps its own proportions.
    const boxClass = isMobileVariant
        ? "relative w-full h-svh overflow-hidden group mobile-gpu"
        : "relative w-full overflow-hidden group mobile-gpu";
    const boxStyle = isMobileVariant
        ? undefined
        : { aspectRatio: currentAspect, maxHeight: `${MAX_ASPECT_HEIGHT_VH}vh` };

    if (loading) {
        return (
            <div className={isMobileVariant ? "w-full h-svh flex items-center justify-center" : "w-full aspect-[16/9] flex items-center justify-center"}>
                <LoadingScreen />
            </div>
        );
    }

    // Nothing targeted at this viewport. The other variant is the one on screen,
    // so a placeholder here would only push the page down behind `display:none`
    // — or show an empty band to the very visitors the admin chose not to
    // target.
    if (activeBanners.length === 0) return null;

    return (
        <motion.div
            style={boxStyle}
            className={boxClass}
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
                    <Link href={activeBanners[currentIndex]?.link_url || "/"} className="block absolute inset-0">
                        {activeBanners[currentIndex]?.image_url ? (
                            <Image
                                src={activeBanners[currentIndex].image_url}
                                alt={`Kurtis Boutique - ${currentIndex === 0 ? 'Featured Collection' : 'Designer Kurtis'}`}
                                fill
                                sizes={SIZES[variant]}
                                priority={currentIndex === 0}
                                quality={90}
                                // Mobile fills the screen edge to edge; desktop keeps
                                // the whole banner in frame.
                                className={isMobileVariant ? "object-cover object-center" : "object-contain"}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-rose-100 to-stone-100 flex items-center justify-center">
                                <span className="text-stone-400">No Image</span>
                            </div>
                        )}
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows — desktop only */}
            {activeBanners.length > 1 && !isMobileVariant && (
                <>
                    <button
                        onClick={handlePrev}
                        aria-label="Previous banner"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label="Next banner"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dots */}
            {activeBanners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    {activeBanners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Go to banner ${idx + 1}`}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
