"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Category } from "@/types";

interface CategoryGridItemProps {
    category: Category;
}

export function CategoryGridItem({ category }: CategoryGridItemProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Collect all product images for this category
    const productImages = category.products?.flatMap(
        product => product.product_images?.map(img => img.image_url) || []
    ) || [];

    // Fallback to category image if no product images
    const allImages = productImages.length > 0 ? productImages : (category.image_url ? [category.image_url] : []);

    // Auto-rotate images every 3 seconds
    useEffect(() => {
        if (allImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % allImages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [allImages.length]);

    return (
        <Link
            href={`/shop?category=${category.id}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary/50"
        >
            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 bg-stone-300">
                {allImages.length > 0 ? (
                    allImages.map((imgUrl, idx) => (
                        <img
                            key={imgUrl}
                            src={imgUrl}
                            alt={category.name}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        />
                    ))
                ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
                        <span className="text-xs">No Image</span>
                    </div>
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
            <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-medium text-lg leading-tight">{category.name}</h3>
            </div>
        </Link>
    );
}
