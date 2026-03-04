# SEO Implementation Guide for kurtisboutique.in

## Files Included

| File | What It Contains | Where to Use |
|------|-----------------|-------------|
| `seo-meta-tags.html` | All meta tags, OG tags, Twitter cards | Reference for `<head>` tags |
| `seo-schema-markup.json` | JSON-LD structured data schemas | Add as `<script type="application/ld+json">` |
| `robots.txt` | Search engine crawl instructions | Place in `/public/robots.txt` |
| `sitemap.xml` | XML sitemap template | Place in `/public/sitemap.xml` (or use next-sitemap) |
| `nextjs-seo-implementation.tsx` | Ready-to-paste Next.js code | Copy into your app files |

---

## Step-by-Step Implementation

### Step 1: Update app/layout.tsx
Copy the `metadata` export and `SchemaMarkup` component from `nextjs-seo-implementation.tsx` into your root layout file.

### Step 2: Add robots.txt
Copy `robots.txt` into your `/public` folder.

### Step 3: Install next-sitemap
```bash
npm install next-sitemap
```
Create `next-sitemap.config.js` in your project root using the config from the implementation file. Add `"postbuild": "next-sitemap"` to your package.json scripts.

### Step 4: Create OG Image
Create a 1200x630px image showcasing your brand and save it as `/public/og-image.jpg`. This image appears when your site is shared on WhatsApp, Facebook, Instagram, and Twitter.

### Step 5: Register with Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: `https://kurtisboutique.in`
3. Verify ownership (DNS or HTML tag method)
4. Submit your sitemap URL: `https://kurtisboutique.in/sitemap.xml`
5. Copy the verification code into the `verification.google` field in your metadata

### Step 6: Register with Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters
2. Import from Google Search Console (easiest method)
3. Submit sitemap

### Step 7: Add Category Page SEO
Use the `categorySEO` mapping and `generateMetadata` function from the implementation file for each collection page.

### Step 8: Add Product Schema
Use the `ProductSchema` component on every product page for rich results in Google (price, availability, ratings).

---

## Target Keywords (Ranked by Priority)

### Brand Keywords (Must Rank #1)
- kurtis boutique
- kurtisboutique
- boutique kurtis
- kurtisboutique.in
- kurtis boutique india

### Primary Commercial Keywords
- buy kurtis online India
- designer kurtis for women
- women ethnic wear online India
- cotton kurtis online
- Anarkali kurtas for women
- kurta sets for women online

### Category Keywords
- festive wear kurtis online
- party wear kurtis India
- co-ord sets women ethnic
- maternity kurtis online India
- family combo sets ethnic wear

### Long-Tail Keywords
- affordable designer kurtis online India
- cotton kurtis free delivery India
- ethnic wear COD India
- printed cotton kurtis for daily wear
- Anarkali kurtas for festive occasions

---

## Quick Wins for Faster Ranking

1. **Google Business Profile**: If you have a physical location, create a Google Business listing
2. **Image Alt Tags**: Add descriptive alt text to every product image (e.g., "Blue Cotton A-Line Kurti for Women - Kurtis Boutique")
3. **URL Structure**: Use clean URLs like `/products/blue-cotton-anarkali-kurti` (not `/products/12345`)
4. **Page Speed**: Optimize images with Next.js Image component, enable compression
5. **Internal Linking**: Link between related products and categories
6. **Social Media**: Share products on Instagram/Facebook with links back to your site
7. **Customer Reviews**: Enable and encourage customer reviews (helps with Product schema rich results)
