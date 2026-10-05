"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Category } from "@/types";

interface BubbleItemProps {
    category: Category;
}

function BubbleItem({ category }: BubbleItemProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Collect all product images for this category
    const productImages = category.products?.flatMap(
        product => product.product_images?.map(img => img.image_url) || []
    ) || [];

    // Fallback to category image if no product images
    const allImages = productImages.length > 0 ? productImages : (category.image_url ? [category.image_url] : []);

    // Auto-rotate images every 2 seconds
    useEffect(() => {
        if (allImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % allImages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [allImages.length]);

    return (
        <Link
            href={`/shop?category=${category.id}`}
            className="group flex flex-col items-center gap-3 min-w-[80px]"
        >
            <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 group-hover:from-primary group-hover:to-primary/60 transition-all duration-300">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background overflow-hidden relative bg-secondary/30">
                    {allImages.length > 0 ? (
                        allImages.map((imgUrl, idx) => (
                            <Image
                                key={imgUrl}
                                src={imgUrl}
                                alt={category.name}
                                fill
                                sizes="96px"
                                quality={70}
                                className={`object-cover transition-opacity duration-500 ease-out group-hover:scale-110 mobile-gpu ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
                                    }`}
                            />
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 font-serif text-lg">
                            {category.name.charAt(0)}
                        </div>
                    )}
                </div>
            </div>

            <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors text-center font-serif tracking-wide">
                {category.name}
            </span>
        </Link>
    );
}

interface CategoryBubblesProps {
    categories: Category[];
}

export function CategoryBubbles({ categories }: CategoryBubblesProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        // 1px slack: scrollLeft is fractional on high-DPI screens.
        setCanScrollLeft(el.scrollLeft > 1);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    // ResizeObserver also fires once on observe, which sets the initial state.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const observer = new ResizeObserver(updateArrows);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [updateArrows, categories.length]);

    const scrollByPage = (direction: -1 | 1) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
    };

    if (!categories || categories.length === 0) return null;

    const arrowClass =
        "hidden md:flex absolute top-1/2 -translate-y-[calc(50%+0.5rem)] z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-md text-foreground/80 hover:text-primary hover:border-primary transition-colors";

    return (
        <div className="w-full border-b border-border/40 bg-gradient-to-b from-white to-transparent py-6">
            <div className="relative container mx-auto px-4">
                {canScrollLeft && (
                    <button
                        type="button"
                        aria-label="Scroll categories left"
                        onClick={() => scrollByPage(-1)}
                        className={`${arrowClass} left-2`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {canScrollRight && (
                    <button
                        type="button"
                        aria-label="Scroll categories right"
                        onClick={() => scrollByPage(1)}
                        className={`${arrowClass} right-2`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                <div ref={scrollRef} onScroll={updateArrows} className="overflow-x-auto scrollbar-hide">
                    <div className="flex justify-start md:justify-center gap-6 md:gap-10 min-w-max pb-2">
                        {categories.map((cat) => (
                            <BubbleItem key={cat.id} category={cat} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
