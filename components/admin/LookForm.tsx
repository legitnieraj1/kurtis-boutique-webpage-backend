"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, sortByDisplayOrder } from "@/lib/utils";
import { instagramShortcode, type Look } from "@/lib/shopByLook";

interface ProductOption {
    id: string;
    name: string;
    slug: string;
    price: number;
    images?: { image_url: string; display_order?: number }[];
}

interface LookFormProps {
    initialData?: Look | null;
    onClose: () => void;
}

/** Pull the slug out of a product URL, or return the input if it already is one. */
function slugFromInput(value: string): string {
    const trimmed = value.trim();
    const match = trimmed.match(/\/product\/([^/?#]+)/);
    return match ? match[1] : trimmed;
}

export function LookForm({ initialData, onClose }: LookFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [instagramUrl, setInstagramUrl] = useState(initialData?.instagram_url || "");
    const [videoUrl, setVideoUrl] = useState(initialData?.video_url || "");
    const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || "");
    const [displayOrder, setDisplayOrder] = useState(initialData?.display_order ?? 0);
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product linking — search the catalogue, or paste a product URL.
    const [product, setProduct] = useState<ProductOption | null>(
        initialData?.product
            ? {
                id: initialData.product.id,
                name: initialData.product.name,
                slug: initialData.product.slug,
                price: initialData.product.price,
                images: initialData.product.images,
            }
            : null
    );
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ProductOption[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced catalogue search
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        const q = query.trim();
        if (q.length < 2 || q.includes("/")) {
            setResults([]);
            return;
        }

        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `/api/products?view=summary&limit=12&search=${encodeURIComponent(q)}`
                );
                const data = await res.json();
                setResults(data.products || []);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [query]);

    /** Resolve a pasted product URL / slug to a real product. */
    const linkByUrl = async () => {
        const slug = slugFromInput(query);
        if (!slug) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
            if (!res.ok) throw new Error("not found");
            const data = await res.json();
            setProduct({
                id: data.product.id,
                name: data.product.name,
                slug: data.product.slug,
                price: data.product.price,
                images: data.product.images,
            });
            setResults([]);
            setQuery("");
        } catch {
            toast.error("No product found for that link");
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!product) {
            toast.error("Link a product first");
            return;
        }
        if (!instagramUrl.trim() && !videoUrl.trim()) {
            toast.error("Add an Instagram reel link or a video URL");
            return;
        }
        if (instagramUrl.trim() && !instagramShortcode(instagramUrl)) {
            toast.error("That does not look like an Instagram reel/post link");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: title.trim() || null,
                description: description.trim() || null,
                instagram_url: instagramUrl.trim() || null,
                video_url: videoUrl.trim() || null,
                thumbnail_url: thumbnailUrl.trim() || null,
                product_id: product.id,
                display_order: Number(displayOrder) || 0,
                is_active: isActive,
            };

            const res = await fetch(
                initialData ? `/api/admin/shop-by-look/${initialData.id}` : "/api/admin/shop-by-look",
                {
                    method: initialData ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Request failed");
            }

            toast.success(initialData ? "Look updated" : "Look added");
            onClose();
        } catch (error: any) {
            console.error("Look save failed:", error);
            toast.error(error.message || "Could not save the look");
        } finally {
            setIsSubmitting(false);
        }
    };

    const productImage = sortByDisplayOrder(product?.images)[0]?.image_url;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{initialData ? "Edit Look" : "Add Look"}</h3>
                <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-md" aria-label="Close">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* PRODUCT */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Linked product *</label>

                {product ? (
                    <div className="flex items-center gap-3 border border-border rounded-md p-3">
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-muted">
                            {productImage && (
                                <Image src={productImage} alt="" fill sizes="48px" quality={70} className="object-cover" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">/product/{product.slug}</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setProduct(null)}>
                            Change
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search products, or paste a product link"
                                    className="pl-9"
                                />
                            </div>
                            {query.includes("/") && (
                                <Button type="button" variant="outline" onClick={linkByUrl} disabled={searching}>
                                    Link
                                </Button>
                            )}
                        </div>

                        {searching && (
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                            </p>
                        )}

                        {results.length > 0 && (
                            <ul className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
                                {results.map((p) => (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProduct(p);
                                                setResults([]);
                                                setQuery("");
                                            }}
                                            className="w-full flex items-center gap-3 p-2 text-left hover:bg-muted"
                                        >
                                            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-muted">
                                                {sortByDisplayOrder(p.images)[0]?.image_url && (
                                                    <Image
                                                        src={sortByDisplayOrder(p.images)[0].image_url}
                                                        alt=""
                                                        fill
                                                        sizes="40px"
                                                        quality={70}
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <span className="text-sm truncate">{p.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* MEDIA */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Instagram reel link</label>
                <Input
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/XXXXXXXXX/"
                />
                <p className="text-xs text-muted-foreground">
                    The reel plays inside the look page via Instagram&apos;s player.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Video file URL (optional)</label>
                <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://…/reel.mp4"
                />
                <p className="text-xs text-muted-foreground">
                    An .mp4 link plays full-bleed and autoplays muted — better than the Instagram embed when you have the file.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail image URL (optional)</label>
                <Input
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Defaults to the product photo"
                />
            </div>

            {/* META */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title (optional)</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Defaults to the product name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Display order</label>
                    <Input
                        type="number"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Defaults to the product description"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                />
                Show on homepage
            </label>

            <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className={cn(isSubmitting && "opacity-70")}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {initialData ? "Save changes" : "Add look"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
