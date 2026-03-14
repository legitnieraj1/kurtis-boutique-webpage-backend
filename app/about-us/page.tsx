import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Kurtis Boutique - Bangalore Based Ethnic Wear Brand India",
    description:
        "Learn about Kurtis Boutique — a premium online ethnic wear brand based in Bangalore with manufacturing in Madurai. Over 30,000 Instagram followers. Shop designer kurtis, kurti sets, cotton kurtis, and boutique clothing shipped across India.",
    keywords: [
        "about kurtis boutique",
        "kurtis boutique india",
        "kurtis boutique bangalore",
        "Indian ethnic wear brand",
        "Bangalore boutique",
        "women fashion India",
        "handcrafted kurtis",
        "kurtis boutique instagram",
        "online boutique india",
    ],
    alternates: { canonical: "/about-us" },
    openGraph: {
        title: "About Kurtis Boutique - Bangalore Based Ethnic Wear Brand India",
        description:
            "Discover the story behind Kurtis Boutique — blending traditional Indian craftsmanship with contemporary fashion. Based in Bangalore, manufacturing in Madurai, 30K+ Instagram followers.",
        url: "https://kurtisboutique.in/about-us",
        siteName: "Kurtis Boutique",
        locale: "en_IN",
        type: "website",
        images: [
            {
                url: "/craftsmanship.jpg",
                width: 800,
                height: 600,
                alt: "Kurtis Boutique - Indian Ethnic Wear Craftsmanship - Bangalore Based Brand",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "About Kurtis Boutique - Bangalore Based Ethnic Wear Brand India",
        description:
            "Discover the story behind Kurtis Boutique — trusted online ethnic wear brand with 30K+ Instagram followers.",
        images: ["/craftsmanship.jpg"],
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background/60 backdrop-blur-sm">
            <Navbar />

            <main>
                {/* Banner */}
                <div className="h-[40vh] bg-secondary/30 flex items-center justify-center">
                    <h1 className="text-4xl md:text-6xl font-serif text-foreground">About Kurtis Boutique</h1>
                </div>

                <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl space-y-16">
                    <section className="text-center space-y-6">
                        <h2 className="text-3xl font-serif">A Legacy of Elegance — From Bangalore to All of India</h2>
                        <div className="w-24 h-1 bg-primary mx-auto"></div>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Kurtis Boutique began with a simple belief: fashion should be an extension of one&apos;s heritage, seamlessly woven into the modern lifestyle.
                            Established in <strong>Bangalore</strong>, with our manufacturing warehouse in <strong>Madurai</strong>, we set out to redefine Indian ethnic wear
                            by blending traditional craftsmanship with contemporary silhouettes. Today, with over <strong>30,000 followers on Instagram</strong>,
                            we are one of India&apos;s most trusted <strong>online ethnic wear boutiques</strong>.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="aspect-square rounded-lg relative overflow-hidden shadow-lg">
                            <img
                                src="/craftsmanship.jpg"
                                alt="Indian ethnic wear craftsmanship at Kurtis Boutique - Designer kurtis made in Madurai India"
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-serif">Crafted with Care in Madurai, Shipped Across India</h3>
                            <p className="text-muted-foreground">
                                Every piece at Kurtis Boutique is a labor of love. We partner with skilled artisans from across India
                                to source the finest fabrics — be it lustrous silks, breezy cottons, or rich linens. Our commitment to quality ensures
                                that you don&apos;t just wear our clothes; you experience them.
                            </p>
                            <p className="text-muted-foreground">
                                From intricate embroidery to hand-block prints, our collections of <strong>designer kurtis</strong>, <strong>kurti sets</strong>,
                                <strong> cotton kurtis</strong>, <strong>festive kurti collections</strong>, <strong>matching mom baby outfits</strong>,
                                and <strong>family combo ethnic wear</strong> celebrate the diverse artistic traditions of India, tailored for the woman of today.
                            </p>
                        </div>
                    </div>

                    <section className="bg-secondary/20 p-8 md:p-12 rounded-xl text-center space-y-6">
                        <h3 className="text-2xl font-serif">Our Philosophy</h3>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            &quot;Minimal luxury&quot; is at the heart of everything we do. We believe in designs that are understated yet impactful,
                            sophisticated yet accessible. We strive to create a wardrobe that empowers you to express your individuality with grace and confidence.
                        </p>
                        <Link href="/shop">
                            <Button size="lg" className="rounded-full px-8" title="Shop designer kurtis and ethnic wear online at Kurtis Boutique India">View Our Collections</Button>
                        </Link>
                    </section>

                    {/* Instagram CTA */}
                    <section className="text-center space-y-4">
                        <h3 className="text-2xl font-serif">Follow Us on Instagram</h3>
                        <p className="text-muted-foreground">
                            Join our community of 30,000+ followers for new arrivals, styling tips, and exclusive offers.
                        </p>
                        <a
                            href="https://www.instagram.com/kurtis.boutique/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                            title="Follow Kurtis Boutique on Instagram - @kurtis.boutique"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                            @kurtis.boutique — 30K+ Followers
                        </a>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
