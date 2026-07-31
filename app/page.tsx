import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { TrustStrip } from "@/components/home/TrustStrip";
import { BrandStory } from "@/components/home/BrandStory";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { CategoryBubbles } from "@/components/home/CategoryBubbles";
import { CategoryGridItem } from "@/components/home/CategoryGridItem";
import { HeroBannerCarousel } from "@/components/ui/HeroBannerCarousel";
import { CircularTestimonialsWrapper } from "@/components/ui/circular-testimonials-wrapper";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { createSupabasePublic, createSupabaseAdmin } from "@/lib/supabase/server";
import { Category, Product } from "@/types";

// ISR: statically render homepage, re-generate in background every 5 minutes.
export const revalidate = 300;

async function getHomeData() {
  const supabase = createSupabasePublic();

  const [bannersRes, categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("categories")
      .select(`
        *,
        products:products(
          id,
          name,
          product_images(image_url)
        )
      `)
      .eq("is_active", true)
      .eq("products.is_active", true)
      .order("display_order"),
    supabase
      .from("products")
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, image_url, display_order, color),
        sizes:product_sizes(id, size, stock_count),
        mom_baby_combos(id, mom_price, baby_base_price),
        family_combos(id, mother_price, father_price, baby_base_price),
                couple_combos(id, women_price, men_price),
                addons:product_addons(id, name, price),
        baby_size_prices(id, size, price)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Reviews require the admin client (RLS blocks anon reads); server-only, never exposed to client bundle.
  let reviews: any[] = [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    reviews = data || [];
  } catch (error) {
    console.error("Failed to fetch reviews for homepage:", error);
  }

  return {
    banners: bannersRes.data || [],
    categories: (categoriesRes.data || []) as unknown as Category[],
    products: (productsRes.data || []) as unknown as Product[],
    reviews,
  };
}

export default async function Home() {
  const { banners, categories, products, reviews } = await getHomeData();

  // "As seen on Instagram" — real post/reel imagery, each shoppable straight
  // to its product page. Images live in /public/insta (saved from the posts).
  const curatedInsta = [
    { src: "/insta/yellow-kurti-set.jpg", href: "/product/yellow-kurti-set-1775217112280" },
    { src: "/insta/shrug-style-kurti.jpg", href: "/product/shrug-style-kurti-1775216972144" },
    { src: "/insta/red-elephant-print-maxi.jpg", href: "/product/red-elephant-print-maxi-1779648208518", isReel: true },
  ];
  const curatedSlugs = new Set([
    "yellow-kurti-set-1775217112280",
    "shrug-style-kurti-1775216972144",
    "red-elephant-print-maxi-1779648208518",
  ]);
  // Fill the remaining tiles with recent product photos (also shoppable).
  const fillInsta = products
    .filter((p) => !curatedSlugs.has(p.slug) && p.images?.[0]?.image_url)
    .slice(0, 3)
    .map((p) => ({ src: p.images[0].image_url, href: `/product/${p.slug}` }));
  const instagramTiles = [...curatedInsta, ...fillInsta];

  return (
    <div className="min-h-screen font-sans selection:bg-primary/20">
      <AnnouncementBar />
      <Navbar />

      <main>
        {/* SEO H1 - Visually styled but present for search engines */}
        <h1 className="sr-only">Kurtis Boutique - Designer Kurtis Online Store India | Buy Ethnic Wear Online</h1>

        {/* Category Bubbles - Pass categories */}
        <CategoryBubbles categories={categories} />

        {/* HERO — full-bleed editorial. Banner carousel sits as the backdrop,
            fixed maroon gradient + serif copy layered on top (CTAs clickable,
            rest pass-through so the carousel arrows/dots still work). */}
        <section
          className="relative w-full h-[70vh] min-h-[480px] md:h-[85vh] md:min-h-[600px] overflow-hidden"
          aria-label="Featured designer kurtis and ethnic wear collections"
        >
          <div className="absolute inset-0">
            <HeroBannerCarousel initialBanners={banners} />
          </div>

          {/* Darkening gradient — left-to-right on desktop, bottom-up on mobile */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/65 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/25 md:to-transparent" />

          {/* Copy block */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end md:items-center">
            <div className="container mx-auto px-6 md:px-8 pb-14 md:pb-0">
              <div className="max-w-xl text-center md:text-left mx-auto md:mx-0 space-y-5">
                <p className="text-[13px] md:text-[14px] uppercase tracking-[0.25em] text-accent-gold font-medium">
                  New Collection · 2025
                </p>
                <h2 className="font-serif text-white text-4xl md:text-6xl leading-[1.05]">
                  Dressed Together,<br />Memories Forever.
                </h2>
                <p className="text-white/80 text-base md:text-lg max-w-md mx-auto md:mx-0">
                  Premium ethnic sets for you, your little one &amp; your whole family.
                </p>
                <div className="pointer-events-auto flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                  <Link
                    href="/shop"
                    className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-7 py-3 text-sm font-medium hover:bg-primary-hover transition-colors shadow-lg"
                  >
                    Shop Collections
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center rounded-full border border-white/70 text-white px-7 py-3 text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Mom &amp; Baby Combos →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <TrustStrip />

        {/* CATEGORY GRID - SEO Optimized with keyword-rich headings */}
        <section className="pt-12 md:pt-20 pb-20 container mx-auto px-4 md:px-8 hidden md:block" aria-label="Shop kurtis by category">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-medium">Shop by Category</p>
              <h2 className="text-3xl md:text-4xl font-serif">Find your occasion</h2>
            </div>
            <Link href="/shop" className="text-primary hover:underline underline-offset-4 hidden sm:block" title="Browse all designer kurtis and ethnic wear online at Kurtis Boutique India">View All Collections →</Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <CategoryGridItem key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        {/* NEW ARRIVALS */}
        <NewArrivalsSection initialProducts={products} />

        {/* BRAND STORY */}
        <BrandStory />

        {/* INSTAGRAM AUTHORITY SECTION - SEO Signal */}
        <section className="py-16 bg-surface-soft" aria-label="Follow Kurtis Boutique on Instagram">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-medium mb-3">As Seen On Instagram</p>
            <h2 className="text-2xl md:text-3xl font-serif mb-4">@kurtisboutique</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of 30,000+ followers on Instagram. Get first access to new designer kurti collections, styling tips, and exclusive offers from India&apos;s trusted online ethnic wear boutique.
            </p>

            <InstagramGrid tiles={instagramTiles} />

            <a
              href="https://www.instagram.com/kurtis.boutique/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-accent-gold text-primary px-8 py-3.5 rounded-full font-medium text-base hover:bg-accent-gold/10 transition-colors duration-300"
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
          <CircularTestimonialsWrapper initialReviews={reviews} />
        </section>

        {/* TRUST SIGNALS & SEO CONTENT BLOCK */}
        <section className="py-16 bg-background" aria-label="About Kurtis Boutique - Trusted online ethnic wear brand India">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <h3 className="font-semibold text-sm">Endless Styles</h3>
                  <p className="text-xs text-muted-foreground">500+ looks, one boutique</p>
                </div>
              </div>

              {/* SEO Content Block - Rich text for Google */}
              <div className="prose prose-stone max-w-none text-center">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Kurtis Boutique</strong> is an online ethnic wear brand with over <strong>30,000 followers on Instagram</strong>.
                  The brand ships premium
                  boutique clothing across <strong>India</strong>, specialising in{" "}
                  <Link href="/shop" className="text-primary hover:underline">mom &amp; baby combos</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">family combos</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">couple combos</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">casual wear</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">maternity &amp; feeding wear</Link>, and{" "}
                  <Link href="/shop" className="text-primary hover:underline">baby dresses</Link>.
                  Shop from our extensive collection of{" "}
                  <Link href="/shop" className="text-primary hover:underline">designer kurtis online</Link>,{" "}
                  <Link href="/shop" className="text-primary hover:underline">cotton kurtis</Link>, and{" "}
                  <Link href="/shop" className="text-primary hover:underline">kurti sets for women</Link>.
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
                <Link href="/about-us" className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full text-sm font-medium text-primary transition-colors" title="About Kurtis Boutique India">About Us</Link>
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
