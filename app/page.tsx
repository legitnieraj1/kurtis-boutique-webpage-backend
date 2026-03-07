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

        {/* HERO CAROUSEL */}
        <section className="w-full">
          <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[600px]">
            <HeroBannerCarousel />
          </div>
        </section>

        {/* HIGHLIGHT BANNER / FILTER BAR */}
        <section className="w-full bg-gradient-to-r from-[#9e5470] via-[#7d3b54] to-[#5a283b] text-white py-6 md:py-8 shadow-md relative z-20 border-b-[6px] border-[#ecd6dd]">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif tracking-widest font-medium mb-3 md:mb-5 drop-shadow-md">
              Your go to customised store
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4 gap-y-2 text-xs sm:text-sm md:text-base lg:text-lg font-sans font-light tracking-wide text-rose-50">
              <span className="whitespace-nowrap px-2">Woman fashion - Normal & Maternity wears</span>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <span className="whitespace-nowrap px-2">Mom & Baby combos</span>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <span className="whitespace-nowrap px-2">Family combos</span>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <span className="whitespace-nowrap px-2">Couple combos</span>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <span className="whitespace-nowrap px-2">Siblings combos</span>
            </div>

          </div>
        </section>

        {/* CATEGORY GRID */}
        <section className="pt-12 md:pt-20 pb-20 container mx-auto px-4 md:px-8 hidden md:block">
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
