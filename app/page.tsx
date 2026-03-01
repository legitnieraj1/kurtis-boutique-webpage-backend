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
        <section className="relative w-full pt-6 md:pt-10 pb-40 md:pb-64 bg-white flex flex-col items-center justify-center overflow-visible">
          <div className="flex flex-col items-center gap-0 animate-in fade-in duration-700 p-4 w-full">
            {/* Logo */}
            <img
              src="/kurtis-logo-large.png"
              alt="Kurtis Boutique"
              className="w-48 sm:w-64 md:w-80 h-auto object-contain drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-forwards"
            />

            {/* Animated Brand Text - Luxury Boutique Style */}
            <div className="flex flex-col items-center justify-center text-center max-w-3xl z-50 relative mx-4 mt-2 mb-8 md:mb-14">

              {/* Primary Headline */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-[#7d3b54] tracking-wider font-light animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-forwards mb-8 md:mb-10">
                Your go to customised store
              </h2>

              {/* Subtext Options */}
              <div className="flex flex-col items-center justify-center gap-y-3 text-sm md:text-base lg:text-lg text-[#8c8c8c] font-sans font-light tracking-wide leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-1000 delay-500 fill-mode-forwards">
                <span className="mb-2">
                  Women fashion – Normal & Maternity wears
                </span>

                <div className="flex flex-wrap items-center justify-center gap-x-3 md:gap-x-4">
                  <span>Mom & Baby combos</span>
                  <span className="text-[10px] text-[#b3b3b3] opacity-60">•</span>
                  <span>Family combos</span>
                  <span className="text-[10px] text-[#b3b3b3] opacity-60">•</span>
                  <span>Couple combos</span>
                  <span className="text-[10px] text-[#b3b3b3] opacity-60">•</span>
                  <span>Siblings combos</span>
                </div>
              </div>

            </div>

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
