"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Category } from "@/types";

export function Footer() {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                if (data.categories) setCategories(data.categories);
            })
            .catch(err => console.error("Footer category fetch error:", err));
    }, []);

    return (
        <footer className="bg-gradient-to-br from-white via-pink-50 to-rose-100/40 pt-16 pb-8 border-t border-pink-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand & Trust Signal */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-serif text-3xl font-extrabold tracking-tight text-foreground">Kurtis Boutique</h3>
                        <p className="text-foreground/90 font-medium text-sm max-w-md leading-relaxed">
                            Kurtis Boutique is an online ethnic wear brand with over 30,000 followers on Instagram.
                            Based in Bangalore with manufacturing in Madurai, the brand ships premium boutique clothing across India.
                            Shop designer kurtis, kurti sets, cotton kurtis, festive kurti collections, matching mom baby outfits, and family combo ethnic wear.
                        </p>

                        {/* Instagram Authority Link */}
                        <a
                            href="https://www.instagram.com/kurtis.boutique/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all duration-300"
                            title="Follow Kurtis Boutique on Instagram - 30K+ Followers"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                            @kurtis.boutique
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">30K+</span>
                        </a>

                        {/* Social Links */}
                        <div className="flex items-center gap-4 pt-2">
                            <a href="https://www.instagram.com/kurtis.boutique/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors text-foreground" title="Kurtis Boutique Instagram">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                <span className="sr-only">Follow Kurtis Boutique on Instagram</span>
                            </a>
                            <a href="https://wa.me/919787635982" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors text-foreground" title="Chat with Kurtis Boutique on WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                <span className="sr-only">WhatsApp Kurtis Boutique</span>
                            </a>
                        </div>
                    </div>

                    {/* Shop Categories - Internal Links for SEO */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg text-foreground uppercase tracking-wide">Shop</h4>
                        <nav aria-label="Shop categories">
                            <ul className="space-y-3 text-sm text-foreground/80 font-medium">
                                <li>
                                    <Link href="/shop" className="hover:text-primary transition-colors hover:font-bold block" title="Shop all designer kurtis and ethnic wear online India">
                                        Shop All Kurtis
                                    </Link>
                                </li>
                                {categories.slice(0, 5).map(cat => (
                                    <li key={cat.id}>
                                        <Link href={`/shop?category=${cat.slug}`} className="hover:text-primary transition-colors hover:font-bold block capitalize" title={`Buy ${cat.name} online at Kurtis Boutique India`}>
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <Link href="/shop?sort=created_at&order=desc" className="hover:text-primary transition-colors hover:font-bold block" title="New arrivals - Latest designer kurtis at Kurtis Boutique">
                                        New Arrivals
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Customer Care - Internal Links */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg text-foreground uppercase tracking-wide">Customer Care</h4>
                        <nav aria-label="Customer care links">
                            <ul className="space-y-3 text-sm text-foreground/80 font-medium">
                                <li><Link href="/about-us" className="hover:text-primary transition-colors hover:font-bold block" title="About Kurtis Boutique - Bangalore based ethnic wear brand">About Us</Link></li>
                                <li><Link href="/contact" className="hover:text-primary transition-colors hover:font-bold block" title="Contact Kurtis Boutique - Get in touch">Contact Us</Link></li>
                                <li><a href="https://shiprocket.co/tracking" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:font-bold block">Track Your Order</a></li>
                                <li><Link href="/exchange-and-shipping" className="hover:text-primary transition-colors hover:font-bold block" title="Exchange and shipping policy - Kurtis Boutique India">Exchange &amp; Shipping</Link></li>
                                <li><Link href="/payment-security" className="hover:text-primary transition-colors hover:font-bold block" title="Secure payment options at Kurtis Boutique">Payment Security</Link></li>
                                <li><Link href="/privacy-policy" className="hover:text-primary transition-colors hover:font-bold block" title="Privacy policy - Kurtis Boutique India">Privacy Policy</Link></li>
                            </ul>
                        </nav>
                    </div>
                </div>

                {/* SEO keyword-rich footer text */}
                <div className="mt-12 pt-8 border-t border-foreground/10">
                    <p className="text-xs text-muted-foreground/60 text-center max-w-3xl mx-auto leading-relaxed mb-6">
                        Kurtis Boutique — Buy designer kurtis online, cotton kurtis, kurti sets for women, festive kurti collection,
                        matching mom baby outfits, family combo ethnic wear. Based in Bangalore, manufacturing in Madurai.
                        Trusted boutique brand with 30K+ Instagram followers. Shipping across India. COD available.
                    </p>
                    <p className="text-center text-sm font-medium text-foreground/60">
                        &copy; {new Date().getFullYear()} Kurtis Boutique. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
