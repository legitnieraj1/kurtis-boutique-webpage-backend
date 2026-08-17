/**
 * Custom next/image loader.
 *
 * WHY THIS EXISTS
 * ---------------
 * By default next/image routes every image through Vercel's optimizer at
 * /_next/image. That endpoint is metered, and when the plan's image
 * transformation allowance runs out Vercel stops serving images and
 * returns HTTP 402 instead. The site does not degrade gracefully: the
 * browser gets a non-image response and renders a broken-image icon, so
 * the shop appears to have lost most of its product photos even though
 * nothing is wrong with the photos, the database or the CDN.
 *
 * That is exactly what happened — 326 of 518 images on the home page
 * were 402s, while the underlying Supabase objects returned 200 fine.
 *
 * Supabase Storage has its own image transformation endpoint, already
 * enabled on this project, which resizes and re-encodes on the fly:
 *
 *     /storage/v1/object/public/<bucket>/<path>       original
 *     /storage/v1/render/image/public/<bucket>/<path> transformed
 *
 * It honours width and quality, returns WebP automatically when the
 * browser's Accept header allows it, and is fronted by Cloudflare, so
 * repeat requests are CDN hits.
 *
 * THIS ENDPOINT IS ALSO METERED
 * -----------------------------
 * An earlier version of this comment claimed the Supabase transformer had
 * no quota to exhaust. It does. Supabase bills "Storage Image
 * Transformations" per *unique origin image* transformed in a billing
 * cycle — 100 included on the Pro plan, then roughly $5 per additional
 * thousand. The meter therefore tracks catalogue size, not traffic: a
 * photo served a million times counts once, and adding products is what
 * moves it.
 *
 * The organisation went to 267/100 on 17 Aug 2026 without anyone noticing,
 * because this file said there was nothing to notice. The spend cap has
 * been turned off deliberately so that going over bills a few dollars
 * instead of putting the project into read-only mode. Leave it off.
 *
 * Cutting the bill to nothing means dropping transformation entirely and
 * serving the original objects. That is only reasonable once every photo
 * in storage is already small: uploads have been downscaled to 1800px and
 * re-encoded since the image-upload fix, but objects stored before it are
 * full-size phone photos and would be far worse to serve raw than to
 * transform.
 */

const SUPABASE_PUBLIC_OBJECT = '/storage/v1/object/public/';
const SUPABASE_RENDER_IMAGE = '/storage/v1/render/image/public/';

// Supabase rejects quality outside this range.
const MIN_QUALITY = 20;
const MAX_QUALITY = 100;

// Transformations are capped so a stray `width` cannot request an
// enormous render. Nothing in the UI needs more than a full-bleed hero.
const MAX_WIDTH = 2560;

export default function supabaseImageLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}): string {
    // Local assets under /public are already sized and are served straight
    // from the CDN — there is nothing to transform.
    if (!src.startsWith('http')) return src;

    // Anything that is not a public Supabase object (an Unsplash URL, say)
    // is passed through untouched rather than guessed at.
    if (!src.includes(SUPABASE_PUBLIC_OBJECT)) return src;

    const target = src.replace(SUPABASE_PUBLIC_OBJECT, SUPABASE_RENDER_IMAGE);

    const params = new URLSearchParams({
        width: String(Math.min(Math.round(width), MAX_WIDTH)),
        quality: String(Math.min(Math.max(Math.round(quality ?? 75), MIN_QUALITY), MAX_QUALITY)),
        // Preserve aspect ratio and cover the requested box, matching what
        // the built-in optimizer did for these layouts.
        resize: 'contain',
    });

    return `${target}?${params.toString()}`;
}
