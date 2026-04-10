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
        {/* SEO H1 - Visually styled but present for search engines */}
        <h1 className="sr-only">Kurtis Boutique - Designer Kurtis Online Store India | Buy Ethnic Wear Online</h1>

        {/* Category Bubbles - Pass categories */}
        <CategoryBubbles categories={categories} />

        {/* HERO CAROUSEL */}
        <section className="w-full" aria-label="Featured designer kurtis and ethnic wear collections">
          <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[600px]">
            <HeroBannerCarousel />
          </div>
        </section>

        {/* HIGHLIGHT BANNER / FILTER BAR */}
        <section className="w-full bg-gradient-to-r from-[#9e5470] via-[#7d3b54] to-[#5a283b] text-white py-6 md:py-8 shadow-md relative z-20 border-b-[6px] border-[#ecd6dd]" aria-label="Kurtis Boutique product categories">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif tracking-widest font-medium mb-3 md:mb-5 drop-shadow-md">
              Your Go-To Boutique Kurtis Online Store
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4 gap-y-2 text-xs sm:text-sm md:text-base lg:text-lg font-sans font-light tracking-wide text-rose-50">
              <Link href="/shop" className="whitespace-nowrap px-2 hover:text-white transition-colors">Designer Kurtis Online</Link>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <Link href="/shop" className="whitespace-nowrap px-2 hover:text-white transition-colors">Cotton Kurti Sets</Link>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <Link href="/shop" className="whitespace-nowrap px-2 hover:text-white transition-colors">Mom &amp; Baby Combo Outfits</Link>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <Link href="/shop" className="whitespace-nowrap px-2 hover:text-white transition-colors">Family Combo Ethnic Wear</Link>
              <span className="hidden md:block text-[#e2a8ba] font-bold">|</span>
              <Link href="/shop" className="whitespace-nowrap px-2 hover:text-white transition-colors">Festive Kurti Collection</Link>
            </div>

          </div>
        </section>

        {/* MARQUEE — promotional ticker */}
        <div className="w-full overflow-hidden bg-[#f9e8ef] border-y border-pink-200/60 py-2.5">
          <div
            className="flex whitespace-nowrap"
            style={{
              animation: "marquee 28s linear infinite",
            }}
          >
            {/* Duplicate the items so the scroll loops seamlessly */}
            {[
              "🌸 Sale is Live Now!",
              "✨ Narayanpet Collections Live!",
              "🛍 New Festive Arrivals!",
              "🤍 Mom & Baby Combos — Shop Now!",
              "🎉 Family Combo Sets Just Dropped!",
              "💸 Free Shipping on Orders ₹999+!",
              "🌸 Sale is Live Now!",
              "✨ Narayanpet Collections Live!",
              "🛍 New Festive Arrivals!",
              "🤍 Mom & Baby Combos — Shop Now!",
              "🎉 Family Combo Sets Just Dropped!",
              "💸 Free Shipping on Orders ₹999+!",
            ].map((text, i) => (
              <span
                key={i}
                className="inline-block mx-8 text-[13px] font-semibold tracking-wide text-[#7d3b54]"
              >
                {text}
              </span>
            ))}
          </div>
        </div>

        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>

        {/* CATEGORY GRID - SEO Optimized with keyword-rich headings */}
        <section className="pt-12 md:pt-20 pb-20 container mx-auto px-4 md:px-8 hidden md:block" aria-label="Shop kurtis by category">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl font-serif">Shop Designer Kurtis by Category</h2>
            <Link href="/shop" className="text-primary hover:underline underline-offset-4 hidden sm:block" title="Browse all designer kurtis and ethnic wear online at Kurtis Boutique India">View All Collections</Link>
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

        {/* INSTAGRAM AUTHORITY SECTION - SEO Signal */}
        <section className="py-16 bg-gradient-to-b from-pink-50/60 to-white" aria-label="Follow Kurtis Boutique on Instagram">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-serif mb-4">Follow Kurtis Boutique on Instagram</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our community of 30,000+ followers on Instagram. Get first access to new designer kurti collections, styling tips, and exclusive offers from India&apos;s trusted online ethnic wear boutique.
            </p>
            <a
              href="https://www.instagram.com/kurtis.boutique/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
              title="Follow Kurtis Boutique on Instagram - 30K+ Followers"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              @kurtis.boutique
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">30K+ Followers</span>
            </a>
          </div>
        </section>

        {/* CUSTOMER TESTIMONIALS */}
        <section className="flex justify-center bg-background py-12" aria-label="Customer reviews and testimonials for Kurtis Boutique">
          <CircularTestimonialsWrapper />
        </section>

        {/* TRUST SIGNALS & SEO CONTENT BLOCK */}
        <section className="py-16 bg-gradient-to-b from-white to-rose-50/40" aria-label="About Kurtis Boutique - Trusted online ethnic wear brand India">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-serif text-center mb-8">Why Shop at Kurtis Boutique?</h2>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <h3 className="font-semibold text-sm">Trusted Brand</h3>
                  <p className="text-xs text-muted-foreground">30,000+ Instagram Followers</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  </div>
                  <h3 className="font-semibold text-sm">All India Shipping</h3>
                  <p className="text-xs text-muted-foreground">Fast delivery across India</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </div>
                  <h3 className="font-semibold text-sm">Secure Payment</h3>
                  <p className="text-xs text-muted-foreground">COD, UPI, Cards accepted</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  </div>
                  <h3 className="font-semibold text-sm">Easy Exchange</h3>
                  <p className="text-xs text-muted-foreground">7-day exchange policy</p>
                </div>
              </div>

              {/* SEO Content Block - Rich text for Google */}
              <div className="prose prose-stone max-w-none text-center">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Kurtis Boutique</strong> is an online ethnic wear brand with over <strong>30,000 followers on Instagram</strong>.
                  Based in <strong>Bangalore</strong> with manufacturing in <strong>Madurai</strong>, the brand ships premium
                  boutique clothing across <strong>India</strong>. Shop from our extensive collection of{" "}
                  <Link href="/shop" className="text-primary hover:underline">designer kurtis online</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">cotton kurtis</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">kurti sets for women</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">festive kurti collections</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">matching mom baby outfits</Link>, and{" "}
                  <Link href="/shop" className="text-primary hover:underline">family combo ethnic wear</Link>.
                  Whether you&apos;re looking to <strong>buy kurtis online in India</strong> for daily wear, office, or festive occasions,
                  Kurtis Boutique is your trusted <strong>ethnic wear boutique online</strong> destination.
                </p>
              </div>

              {/* Internal links for SEO */}
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/shop" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Buy designer kurtis online India">Designer Kurtis</Link>
                <Link href="/shop" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Cotton kurtis online India">Cotton Kurtis</Link>
                <Link href="/shop" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Kurti sets for women online">Kurti Sets</Link>
                <Link href="/shop" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Festive kurti collection online India">Festive Kurtis</Link>
                <Link href="/shop" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Mom baby matching outfits India">Mom &amp; Baby Combos</Link>
                <Link href="/shop" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Family combo ethnic wear India">Family Combos</Link>
                <Link href="/about-us" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="About Kurtis Boutique Bangalore India">About Us</Link>
                <Link href="/contact" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="Contact Kurtis Boutique">Contact</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
