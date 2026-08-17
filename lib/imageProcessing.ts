// Client-side photo preparation for the admin product form.
//
// Photos come straight off a phone: 4-12 MB HEIC or JPEG, 4000px+ on the long
// edge. Two things went wrong with those:
//
//   * The serverless request body cap (4.5 MB on Vercel) rejected the upload
//     outright, so the picture silently never appeared. Cropping the photo in
//     the phone's gallery re-encoded it smaller, which is why cropping
//     "sometimes" worked — it was the file size, not the crop.
//   * HEIC files that did upload are not renderable by most browsers.
//
// Downscaling and re-encoding to JPEG here fixes both, and cuts a 9 MB photo
// to roughly 300 KB with no visible loss at the sizes the storefront renders.

/** Long edge, in pixels, of the stored photo. The product gallery renders at
 *  well under this even on a desktop retina screen. */
const MAX_EDGE = 1800;
const JPEG_QUALITY = 0.85;
/** Anything at or under this that is already a web format is left alone. */
const PASSTHROUGH_BYTES = 900 * 1024;
const WEB_SAFE = ['image/jpeg', 'image/png', 'image/webp'];

/** Decode a File to something drawable. `createImageBitmap` handles HEIC on
 *  Apple devices (where these photos come from); the <img> path covers
 *  browsers that reject the bitmap call but can still decode the format. */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
    try {
        return await createImageBitmap(file);
    } catch {
        // Fall through to the <img> decoder.
    }

    const url = URL.createObjectURL(file);
    try {
        const img = new window.Image();
        img.decoding = 'async';
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('decode failed'));
            img.src = url;
        });
        return img;
    } finally {
        // The bitmap is already rasterised into the element by the time this
        // runs; revoking here avoids leaking one object URL per photo.
        URL.revokeObjectURL(url);
    }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
            'image/jpeg',
            JPEG_QUALITY
        );
    });
}

/**
 * Return an upload-ready JPEG for `file`: downscaled to {@link MAX_EDGE} and
 * re-encoded. Small web-format files are returned unchanged.
 *
 * Throws with a message meant for the admin if the browser cannot read the
 * photo at all, so the form can name the file that failed instead of dropping
 * it silently.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
    if (!file.type.startsWith('image/') && !/\.(hei[cf]|jpe?g|png|webp)$/i.test(file.name)) {
        throw new Error(`${file.name} is not an image`);
    }

    if (file.size <= PASSTHROUGH_BYTES && WEB_SAFE.includes(file.type)) {
        return file;
    }

    let source: ImageBitmap | HTMLImageElement;
    try {
        source = await decode(file);
    } catch {
        throw new Error(
            `${file.name} could not be read by this browser — open it in Photos, ` +
            `export or crop it as a JPEG, and add it again`
        );
    }

    const width = source.width;
    const height = source.height;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`${file.name} could not be processed`);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    if ('close' in source) source.close();

    const blob = await toBlob(canvas);
    // Free the backing store immediately — mobile Safari is quick to discard
    // canvases it thinks are idle, and several photos in a row add up.
    canvas.width = 0;
    canvas.height = 0;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
}

/** POST `body` to `url`, retrying transient failures. Phone connections drop
 *  mid-upload often enough that a single attempt loses photos. */
export async function uploadWithRetry(
    url: string,
    body: FormData,
    attempts = 3
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const res = await fetch(url, { method: 'POST', body });
            // 4xx other than 408/429 is a real rejection; retrying won't help.
            if (res.ok || (res.status < 500 && res.status !== 408 && res.status !== 429)) {
                return res;
            }
            lastError = new Error(`Server responded ${res.status}`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Network error');
        }

        if (attempt < attempts) {
            await new Promise((r) => setTimeout(r, 600 * attempt));
        }
    }

    throw lastError ?? new Error('Upload failed');
}
