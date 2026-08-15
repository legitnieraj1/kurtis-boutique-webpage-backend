/** Shared types + helpers for the Shop By Look section. */

export interface LookProduct {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    discount_price?: number | null;
    is_active?: boolean;
    images?: { image_url: string; display_order?: number }[];
}

export interface Look {
    id: string;
    title?: string | null;
    description?: string | null;
    instagram_url?: string | null;
    video_url?: string | null;
    thumbnail_url?: string | null;
    product_id: string;
    display_order: number;
    is_active: boolean;
    product?: LookProduct | null;
}

/** Columns every read of a look needs, product join included. */
export const LOOK_FIELDS = `
    id, title, description, instagram_url, video_url, thumbnail_url,
    product_id, display_order, is_active,
    product:products(
        id, name, slug, description, price, discount_price, is_active,
        images:product_images(image_url, display_order)
    )
`;

/**
 * Instagram reel shortcode from any permalink form:
 * /reel/CODE/, /reels/CODE/, /p/CODE/, /tv/CODE/, with or without query string.
 */
export function instagramShortcode(url?: string | null): string | null {
    if (!url) return null;
    const match = url.match(/instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
}

/** Embeddable player URL for an Instagram permalink, or null if not one. */
export function instagramEmbedUrl(url?: string | null): string | null {
    const code = instagramShortcode(url);
    return code ? `https://www.instagram.com/reel/${code}/embed/` : null;
}

/** A look's product photos in the order the admin arranged them. */
export function lookProductImages(look: Look) {
    return [...(look.product?.images || [])].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
}

/** Tile image: explicit thumbnail wins, else the product's first photo. */
export function lookThumbnail(look: Look): string | null {
    if (look.thumbnail_url) return look.thumbnail_url;
    return lookProductImages(look)[0]?.image_url || null;
}
