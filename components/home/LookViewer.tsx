"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { instagramEmbedUrl, type Look } from "@/lib/shopByLook";

interface LookViewerProps {
    look: Look;
    prevId: string | null;
    nextId: string | null;
}

/**
 * Reel on the left, buy card on the right. A hosted .mp4 plays natively;
 * otherwise the Instagram permalink is embedded in its own player.
 */
export function LookViewer({ look, prevId, nextId }: LookViewerProps) {
    const product = look.product;
    const images = [...(product?.images || [])].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    const [activeImage, setActiveImage] = useState(images[0]?.image_url || "");

    const embedUrl = instagramEmbedUrl(look.instagram_url);
    const price = product?.discount_price || product?.price || 0;
    const isDiscounted = !!product?.discount_price && product.discount_price < product.price;
    const heading = look.title || product?.name || "Shop the look";
    const copy = look.description || product?.description || "";

    return (
        <section className="bg-surface-soft py-6 md:py-12" aria-label={`Shop the look: ${heading}`}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="font-serif text-2xl md:text-3xl">{heading}</h1>
                    <Link
                        href="/#shop-by-look"
                        aria-label="Close and return to the homepage"
                        className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </Link>
                </div>

                <div className="relative">
                    {/* Prev / next looks */}
                    {prevId && (
                        <Link
                            href={`/look/${prevId}`}
                            aria-label="Previous look"
                            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    )}
                    {nextId && (
                        <Link
                            href={`/look/${nextId}`}
                            aria-label="Next look"
                            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    )}

                    <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start max-w-5xl mx-auto">
                        {/* REEL */}
                        <div className="relative w-full max-w-[420px] mx-auto lg:mx-0 overflow-hidden rounded-xl bg-black">
                            {look.video_url ? (
                                <video
                                    src={look.video_url}
                                    poster={look.thumbnail_url || images[0]?.image_url}
                                    className="w-full aspect-[9/16] object-cover"
                                    controls
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    title={`${heading} reel`}
                                    className="w-full aspect-[9/16] border-0"
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                    scrolling="no"
                                />
                            ) : (
                                <div className="w-full aspect-[9/16] flex items-center justify-center text-white/70 text-sm">
                                    Video unavailable
                                </div>
                            )}
                        </div>

                        {/* BUY CARD */}
                        {product ? (
                            <div className="bg-background rounded-xl border border-border p-4 md:p-6 space-y-5">
                                {images.length > 0 && (
                                    <>
                                        <div className="relative aspect-[3/4] max-h-[360px] overflow-hidden rounded-lg bg-secondary/10">
                                            <Image
                                                src={activeImage}
                                                alt={`${product.name} from Kurtis Boutique India`}
                                                fill
                                                sizes="(max-width: 1024px) 90vw, 40vw"
                                                quality={80}
                                                className="object-cover"
                                                priority
                                            />
                                        </div>

                                        {images.length > 1 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1">
                                                {images.slice(0, 6).map((img) => (
                                                    <button
                                                        key={img.image_url}
                                                        type="button"
                                                        onClick={() => setActiveImage(img.image_url)}
                                                        className={cn(
                                                            "relative h-16 w-12 shrink-0 overflow-hidden rounded border transition-colors",
                                                            activeImage === img.image_url
                                                                ? "border-primary"
                                                                : "border-transparent hover:border-border"
                                                        )}
                                                    >
                                                        <Image
                                                            src={img.image_url}
                                                            alt=""
                                                            fill
                                                            sizes="48px"
                                                            quality={70}
                                                            className="object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="space-y-1">
                                    <h2 className="font-serif text-xl md:text-2xl">{product.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold">{formatPrice(price)}</span>
                                        {isDiscounted && (
                                            <span className="text-sm text-muted-foreground line-through">
                                                {formatPrice(product.price)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {copy && (
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                                            Description
                                        </p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                                            {copy}
                                        </p>
                                    </div>
                                )}

                                <Link
                                    href={`/product/${product.slug}`}
                                    className="block w-full text-center rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium tracking-wide hover:bg-primary-hover transition-colors"
                                >
                                    Buy Now
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-background rounded-xl border border-border p-6 text-sm text-muted-foreground">
                                This look is not linked to a product yet.
                            </div>
                        )}
                    </div>

                    {/* Mobile prev/next */}
                    <div className="flex lg:hidden items-center justify-center gap-3 mt-6">
                        {prevId && (
                            <Link
                                href={`/look/${prevId}`}
                                className="inline-flex items-center gap-1 text-sm text-primary"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Link>
                        )}
                        {nextId && (
                            <Link
                                href={`/look/${nextId}`}
                                className="inline-flex items-center gap-1 text-sm text-primary"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
