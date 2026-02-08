"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CategoryBubbles } from "@/components/home/CategoryBubbles";
import { CategoryGridItem } from "@/components/home/CategoryGridItem";
import { HeroBannerCarousel } from "@/components/ui/HeroBannerCarousel";
import { CircularTestimonialsWrapper } from "@/components/ui/circular-testimonials-wrapper";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Category } from "@/types";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-primary/20">
      <Navbar />

      <main>
        {/* Category Bubbles - Pass categories */}
        <CategoryBubbles categories={categories} />

        {/* HERO SECTION */}
        <section className="relative w-full pt-10 pb-40 md:pb-64 bg-white flex flex-col items-center justify-center overflow-visible">
          <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700 p-4 w-full">
            {/* Logo */}
            <img
              src="/kurtis-logo-large.png"
              alt="Kurtis Boutique"
              className="w-48 sm:w-64 md:w-80 h-auto object-contain drop-shadow-sm mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-forwards"
            />

            {/* Overlapping Banner */}
            <div className="absolute -bottom-24 md:-bottom-44 w-[90%] md:w-[80%] max-w-5xl h-[200px] md:h-[350px] rounded-xl overflow-hidden shadow-2xl z-20">
              <HeroBannerCarousel />
            </div>
          </div>
        </section>

        {/* CATEGORY GRID */}
        <section className="pt-40 md:pt-64 pb-20 container mx-auto px-4 md:px-8 hidden md:block">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl font-serif">Shop by Category</h2>
            <Link href="/shop" className="text-primary hover:underline underline-offset-4 hidden sm:block">View All</Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)
            ) : (
              categories.map((cat) => (
                <CategoryGridItem key={cat.id} category={cat} />
              ))
            )}
          </div>
        </section>

        {/* NEW ARRIVALS */}
        <NewArrivalsSection />

        {/* CUSTOMER TESTIMONIALS */}
        <section className="flex justify-center bg-background py-12">
          <CircularTestimonialsWrapper />
        </section>
      </main>

      <Footer />
    </div>
  );
}
