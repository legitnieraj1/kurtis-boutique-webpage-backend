"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { lookThumbnail, type Look } from "@/lib/shopByLook";

/**
 * Shoppable reels rail. Each tile opens /look/<id>, where the reel plays next
 * to a buy card for the linked product.
 */
export function ShopByLookSection({ looks }: { looks: Look[] }) {
    const scrollerRef = useRef<HTMLDivElement>(null);

    if (!looks?.length) return null;

    const scrollBy = (direction: "left" | "right") => {
        const el = scrollerRef.current;
        if (!el) return;
        // One tile plus its gap — keeps the rail aligned after every nudge.
        const step = el.clientWidth * 0.4;
        el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
    };

    return (
        <section className="py-14 md:py-20 bg-surface-soft" aria-label="Shop by look">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-10 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-medium">
                        Seen In Motion
                    </p>
                    <h2 className="text-3xl md:text-4xl font-serif text-foreground">Shop By Look</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Watch the reel, then shop the exact piece.
                    </p>
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => scrollBy("left")}
                        aria-label="Previous looks"
                        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div
                        ref={scrollerRef}
                        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {looks.map((look) => {
                            const thumb = lookThumbnail(look);
                            const product = look.product;
                            const price = product?.discount_price || product?.price || 0;

                            return (
                                <Link
                                    key={look.id}
                                    href={`/look/${look.id}`}
                                    className="group snap-start shrink-0 w-[62vw] sm:w-[46vw] md:w-[30vw] lg:w-[22vw] max-w-[320px]"
                                    title={`Shop the look: ${look.title || product?.name || ""}`}
                                >
                                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-secondary/10">
                                        {thumb ? (
                                            <Image
                                                src={thumb}
                                                alt={`${look.title || product?.name || "Look"} - shoppable reel from Kurtis Boutique`}
                                                fill
                                                sizes="(max-width: 768px) 62vw, 22vw"
                                                quality={75}
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-xs">
                                                No preview
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="h-12 w-12 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110">
                                                <Play className="h-5 w-5 translate-x-[1px] fill-foreground text-foreground" />
                                            </span>
                                        </span>
                                    </div>

                                    {product && (
                                        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-background p-2.5">
                                            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-muted">
                                                {product.images?.[0]?.image_url && (
                                                    <Image
                                                        src={product.images[0].image_url}
                                                        alt=""
                                                        fill
                                                        sizes="40px"
                                                        quality={70}
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{formatPrice(price)}</p>
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => scrollBy("right")}
                        aria-label="More looks"
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
