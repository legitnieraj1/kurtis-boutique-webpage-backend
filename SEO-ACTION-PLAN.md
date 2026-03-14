# Kurtis Boutique — SEO Action Plan
### Why Your Site Isn't Showing on Google (and Exactly How to Fix It)

---

## The Core Problem

Technical SEO code alone does not make your site rank. Google must first:
1. **Know your site exists** — via Google Search Console
2. **Be allowed to crawl it** — via correct robots.txt ✅ (fixed)
3. **Have a map of all your pages** — via sitemap.xml ✅ (fixed — now includes all products)
4. **Crawl and index your pages** — takes 1–4 weeks after submission
5. **Trust your site** — via backlinks and brand signals

---

## Critical Fixes Already Applied (Done)

| Fix | Status | Impact |
|-----|--------|--------|
| Dynamic sitemap now includes ALL product URLs | ✅ Done | 🔴 Critical |
| Removed /admin, /checkout from sitemap | ✅ Done | 🟡 Medium |
| robots.ts now auto-generated (always fresh) | ✅ Done | 🟡 Medium |
| Googlebot crawl-delay removed (was slowing crawl) | ✅ Done | 🟡 Medium |
| Product page titles: "Name \| Kurtis Boutique India" | ✅ Done | 🟡 Medium |
| All 6 JSON-LD schemas (ClothingStore, LocalBusiness, FAQ, etc.) | ✅ Done | 🟠 High |
| Instagram authority in Organization sameAs | ✅ Done | 🟠 High |
| Homepage trust signals + SEO content blocks | ✅ Done | 🟠 High |
| ProductCard image alt text with keywords | ✅ Done | 🟡 Medium |

---

## Step 1 — Deploy Your Latest Code (REQUIRED FIRST)

All SEO changes must be live on your domain before Google can see them.

```
Push to your hosting (Vercel/etc.) and verify at:
https://kurtisboutique.in/sitemap.xml  → should show your product URLs
https://kurtisboutique.in/robots.txt   → should show allow/disallow rules
```

**Verify these 3 URLs work after deploying:**
- `https://kurtisboutique.in/` — homepage loads
- `https://kurtisboutique.in/sitemap.xml` — shows XML with product slugs
- `https://kurtisboutique.in/robots.txt` — shows crawl rules

---

## Step 2 — Set Up Google Search Console (MOST IMPORTANT STEP)

This is how Google officially learns your site exists.

**Action steps:**

1. Go to **https://search.google.com/search-console/**
2. Click **"Add property"**
3. Choose **"URL prefix"** and enter: `https://kurtisboutique.in`
4. Choose **"HTML tag"** verification method
5. Copy the code that looks like: `abc123xyz`
6. Open `app/layout.tsx` in your code
7. Find this line: `// google: "PASTE_YOUR_VERIFICATION_CODE_HERE",`
8. Replace with: `google: "abc123xyz",` (your actual code)
9. Deploy and then click **"Verify"** in Search Console

---

## Step 3 — Submit Your Sitemap to Google

After verifying in Search Console:

1. In Search Console, click **"Sitemaps"** in the left menu
2. Enter: `sitemap.xml`
3. Click **"Submit"**
4. Wait 24–48 hours — it will show how many URLs were indexed

Your sitemap now includes:
- Homepage
- /shop
- All product pages (`/product/slug`)
- All category filter pages
- About, Contact, Policy pages

---

## Step 4 — Request Indexing for Key Pages

Don't wait for Google to crawl — manually request it:

1. In Search Console, paste each URL into the top search bar
2. Click **"Request Indexing"** for each:
   - `https://kurtisboutique.in/`
   - `https://kurtisboutique.in/shop`
   - Your 5 best product URLs

This tells Google to crawl these pages within 24–72 hours.

---

## Step 5 — Add Google Business Profile (Local SEO)

This helps rank for searches like "kurtis boutique bangalore" and "online boutique india".

1. Go to **https://business.google.com/**
2. Add your business: **Kurtis Boutique**
3. Category: **Clothing Store** / **Women's Clothing Store**
4. Address: Bangalore, Karnataka (can be service area only if you don't have a physical storefront)
5. Website: `https://kurtisboutique.in`
6. Phone: +91 9787635982
7. Hours: Mon–Sat 10:30–20:30, Sun 11:00–19:00
8. **Add photos** of your products

---

## Step 6 — Instagram → Website Authority Link

Instagram is your biggest SEO asset (30,000+ followers).

**Do these immediately:**

1. In your **Instagram bio**, make sure the link is set to `https://kurtisboutique.in`
2. Add this text in your Instagram bio:
   ```
   🛍️ Shop kurtis online ➡ kurtisboutique.in
   ```
3. In Instagram posts, regularly say:
   > "Shop the look at kurtisboutique.in — link in bio"
4. In Instagram Stories/Reels, use the **Link sticker** pointing to your website
5. Create a **Linktree or direct bio link** with your top product categories

Every time someone clicks from Instagram → your website, Google sees a real human signal. With 30K followers, this is powerful.

---

## Step 7 — Build Your First Backlinks (Week 1–2)

Google trusts websites that other sites link to. Without backlinks, even perfect SEO code won't rank.

**Easy, free backlinks to get NOW:**

| Source | How to Get It | Priority |
|--------|---------------|----------|
| Instagram bio link | Already done if you followed Step 6 | 🔴 Do now |
| WhatsApp Business profile | Add kurtisboutique.in to your WhatsApp Business profile | 🔴 Do now |
| Google Business Profile | Link in your Google Business listing | 🔴 Do now |
| JustDial | List your business at justdial.com | 🟠 This week |
| IndiaMART | List your business at indiamart.com | 🟠 This week |
| Sulekha | List at sulekha.com as a clothing store | 🟠 This week |
| Facebook Page | Create a Facebook Business Page, link to site | 🟡 This week |
| Pinterest | Create a Pinterest account, pin your products linking back to your product pages | 🟡 High value |
| YouTube | Create a short video about your brand, link in description | 🟡 High value |
| Meesho/Myntra | If you sell on these, your brand name gets associated with searches | 🟡 Medium |

---

## Step 8 — Content Strategy for Keyword Ranking

Google ranks pages based on **content relevance**. Add these pages to your website:

### Blog Posts to Create (Target Long-tail Keywords)
These are low-competition keywords that will bring traffic quickly:

1. **"Best Cotton Kurtis for Women in India 2025"**
   - Target keyword: `best cotton kurtis online india`

2. **"Matching Mom and Baby Outfits — Complete Guide"**
   - Target keyword: `matching mom baby outfits india`

3. **"How to Style Kurti Sets for Festive Occasions"**
   - Target keyword: `kurti sets for women festive`

4. **"Designer Kurtis from Bangalore — Kurtis Boutique Story"**
   - Target keyword: `kurtis boutique bangalore`

5. **"Family Combo Ethnic Wear — Shop Matching Sets"**
   - Target keyword: `family combo ethnic wear india`

Each blog post = one more page that can rank on Google.

---

## Step 9 — Monitor Your Rankings

Once your site is indexed (2–4 weeks after Search Console setup):

1. **Google Search Console** → "Search results" → Shows which keywords show your site and at what position
2. **Google Analytics (free)** → Set up at analytics.google.com → tracks real visitors
3. **Check indexing**: Search `site:kurtisboutique.in` on Google — shows all indexed pages

---

## Timeline of What to Expect

| Week | What Happens |
|------|-------------|
| Deploy + Search Console setup | Google learns your site exists |
| Week 1–2 | Googlebot crawls your sitemap, starts indexing pages |
| Week 2–3 | Homepage and shop page appear in Google (low rankings) |
| Week 3–4 | Product pages start appearing in search results |
| Month 2 | Rankings improve as Google measures click-through rates |
| Month 3+ | Backlinks from Step 7 push rankings higher |
| Month 6 | With consistent Instagram linking + content, target page 1 for brand keywords |

---

## Quick Wins Checklist (Do Today)

- [ ] Deploy latest code to kurtisboutique.in
- [ ] Verify sitemap.xml shows products at `https://kurtisboutique.in/sitemap.xml`
- [ ] Set up Google Search Console + verify domain
- [ ] Submit sitemap.xml in Search Console
- [ ] Request indexing for homepage, /shop, and 5 products
- [ ] Update Instagram bio link to `https://kurtisboutique.in`
- [ ] Set up Google Business Profile
- [ ] List on JustDial, IndiaMART, Sulekha (free)

---

## Why "Kurtis Boutique" Searches Don't Find You Yet

When someone searches **"kurtis boutique"** on Google right now, they see:
- Other sites that have been indexed for months/years
- Sites with backlinks pointing to them
- Pages Google has already crawled many times

Your site is technically perfect but **Google doesn't know it exists yet** because:
1. Search Console was never set up
2. The sitemap had no product URLs (now fixed)
3. No external sites link to you (backlinks needed)

After following this plan, your site will start appearing within **2–4 weeks** for brand searches like "kurtis boutique" and "kurtis boutique online", and within **1–3 months** for competitive keywords like "buy kurtis online india".

---

*Document generated by Claude for Kurtis Boutique — kurtisboutique.in*
*Last updated: March 2026*
