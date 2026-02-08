"use client";

import { useEffect, useState } from "react";
import { CircularTestimonials } from "./circular-testimonials";

interface Review {
    id: string;
    reviewer_name: string;
    reviewer_image?: string;
    rating: number;
    comment: string;
    verified: boolean;
}

export function CircularTestimonialsWrapper() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Fetch reviews from API
        async function fetchReviews() {
            try {
                // Use the public reviews endpoint
                const res = await fetch('/api/admin/reviews');
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data.reviews || []);
                }
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            }
        }
        fetchReviews();
    }, []);

    if (!mounted) return null;

    // Transform API response to match expected format
    const testimonials = reviews.map((r, index) => ({
        id: index + 1, // Use numeric index instead of UUID
        name: r.reviewer_name,
        image: r.reviewer_image || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
        rating: r.rating,
        verified: r.verified,
        createdAt: new Date().toISOString(),
    }));

    // Brand Colors
    const colors = {
        name: "#801848", // Deep Wine
        arrowBackground: "#801848", // Deep Wine
        arrowForeground: "#FDFBF7", // Ivory
        arrowHoverBackground: "#B05480", // Rose Mauve
        starFilled: "#801848", // Deep Wine
        starEmpty: "#E5E7EB", // Soft Gray
    };

    return (
        <CircularTestimonials
            testimonials={testimonials}
            colors={colors}
            fontSizes={{
                name: "1.75rem",
            }}
        />
    );
}
