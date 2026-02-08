"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
                            <img
                                key={imgUrl}
                                src={imgUrl}
                                alt={category.name}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out group-hover:scale-110 mobile-gpu ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
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
    if (!categories || categories.length === 0) return null;

    return (
        <div className="w-full border-b border-border/40 bg-gradient-to-b from-white to-transparent py-6">
            <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
                <div className="flex justify-start md:justify-center gap-6 md:gap-10 min-w-max pb-2">
                    {categories.map((cat) => (
                        <BubbleItem key={cat.id} category={cat} />
                    ))}
                </div>
            </div>
        </div>
    );
}
