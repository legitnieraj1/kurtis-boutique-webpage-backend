// ============================================================
// NEXT.JS SEO IMPLEMENTATION FOR kurtisboutique.in
// ============================================================
// This file contains ready-to-use code snippets for your
// Next.js App Router setup. Copy each section into the
// appropriate file in your project.
// ============================================================


// ============================================================
// FILE: app/layout.tsx (ROOT LAYOUT - METADATA)
// ============================================================
// Replace your existing metadata export with this:

import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Base URL for resolving relative URLs
  metadataBase: new URL('https://kurtisboutique.in'),

  // Primary title template - applies to all pages
  title: {
    default: 'Kurtis Boutique | Buy Designer Kurtis & Ethnic Wear Online India',
    template: '%s | Kurtis Boutique India',
  },

  description:
    'Shop premium designer kurtis, kurtas, co-ords & festive ethnic wear for women online at Kurtis Boutique India. Free delivery, COD available. Explore cotton kurtis, Anarkali kurtas, maternity wear & more.',

  keywords: [
    'kurtis boutique',
    'kurtisboutique',
    'boutique kurtis',
    'buy kurtis online India',
    'designer kurtis for women',
    'women ethnic wear online',
    'cotton kurtis',
    'Anarkali kurtas',
    'festive wear kurtis',
    'party wear kurtis',
    'co-ord sets women',
    'maternity kurtis',
    'affordable kurtis online India',
    'kurta sets for women',
    'Indian fashion online',
    'ethnic wear shopping India',
    'A-line kurtis',
    'straight kurtas for women',
    'printed kurtis',
    'silk kurtas',
    'georgette kurtis',
    'office wear kurtis',
    'casual kurtis online',
  ],

  authors: [{ name: 'Kurtis Boutique' }],

  // Canonical URL
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/',
    },
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://kurtisboutique.in',
    siteName: 'Kurtis Boutique',
    title: 'Kurtis Boutique | Designer Kurtis & Ethnic Wear Online India',
    description:
      'Shop premium designer kurtis, kurtas, co-ords & festive ethnic wear for women. Free delivery & COD available across India.',
    images: [
      {
        url: '/og-image.jpg', // CREATE THIS: 1200x630px image
        width: 1200,
        height: 630,
        alt: 'Kurtis Boutique - Designer Ethnic Wear for Women',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Kurtis Boutique | Designer Kurtis & Ethnic Wear Online India',
    description:
      'Shop premium designer kurtis, kurtas, co-ords & festive ethnic wear for women. Free delivery & COD available across India.',
    images: ['/og-image.jpg'],
    // creator: '@kurtisboutique',  // Uncomment if you have Twitter
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add your codes after registering)
  verification: {
    google: 'YOUR_GOOGLE_SEARCH_CONSOLE_CODE', // Get from Google Search Console
    // yandex: 'YOUR_YANDEX_CODE',
    // other: { 'msvalidate.01': 'YOUR_BING_CODE' },
  },

  // App icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Manifest
  manifest: '/site.webmanifest',
};


// ============================================================
// FILE: app/layout.tsx (SCHEMA MARKUP - ADD TO BODY)
// ============================================================
// Add these <script> tags inside your RootLayout component,
// right after the opening <body> tag:

function SchemaMarkup() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://kurtisboutique.in/#organization',
    name: 'Kurtis Boutique',
    alternateName: ['KurtisBoutique', 'Kurtis Boutique India'],
    url: 'https://kurtisboutique.in',
    logo: {
      '@type': 'ImageObject',
      url: 'https://kurtisboutique.in/logo.png',
      width: 512,
      height: 512,
    },
    description:
      'Premium Indian womens boutique offering designer kurtis, kurtas, co-ords, festive wear, and maternity collections across India.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [
      'https://www.instagram.com/kurtisboutique/',
      'https://www.facebook.com/kurtisboutique/',
      // Add your actual social media URLs
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://kurtisboutique.in/#website',
    name: 'Kurtis Boutique',
    alternateName: 'KurtisBoutique',
    url: 'https://kurtisboutique.in',
    publisher: { '@id': 'https://kurtisboutique.in/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://kurtisboutique.in/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': 'https://kurtisboutique.in/#store',
    name: 'Kurtis Boutique',
    url: 'https://kurtisboutique.in',
    description:
      'Shop designer kurtis, ethnic wear, co-ords & festive collections for women online in India.',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Credit Card, Debit Card, UPI, Cash on Delivery, Net Banking',
    priceRange: '₹₹',
    areaServed: { '@type': 'Country', name: 'India' },
    brand: { '@type': 'Brand', name: 'Kurtis Boutique' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
    </>
  );
}

// USE IT IN YOUR LAYOUT:
// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body>
//         <SchemaMarkup />
//         {children}
//       </body>
//     </html>
//   );
// }


// ============================================================
// FILE: app/collections/[slug]/page.tsx (CATEGORY PAGE SEO)
// ============================================================
// Example: How to add SEO to each collection/category page

type CategoryPageProps = {
  params: { slug: string };
};

// Category SEO data mapping
const categorySEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  kurtis: {
    title: 'Buy Designer Kurtis for Women Online',
    description:
      'Shop designer kurtis at Kurtis Boutique. Explore A-line, Anarkali, straight, cotton & printed kurtis for women. Free delivery & COD across India.',
    keywords: [
      'designer kurtis',
      'kurtis for women',
      'buy kurtis online',
      'cotton kurtis',
      'Anarkali kurtis',
      'A-line kurtis',
      'printed kurtis',
      'casual kurtis',
      'party wear kurtis',
    ],
  },
  'co-ords': {
    title: 'Co-ord Sets for Women Online',
    description:
      'Shop stylish co-ord sets for women at Kurtis Boutique. Matching ethnic & fusion co-ords perfect for every occasion. COD available.',
    keywords: [
      'co-ord sets women',
      'ethnic co-ords',
      'matching sets women',
      'co-ord sets online India',
    ],
  },
  'festive-wear': {
    title: 'Festive Wear for Women Online',
    description:
      'Shop stunning festive wear at Kurtis Boutique. Designer ethnic outfits for Diwali, Eid, Puja & celebrations. Free delivery across India.',
    keywords: [
      'festive wear women',
      'festival kurtis',
      'Diwali outfits',
      'ethnic festive wear',
      'party wear kurtis',
    ],
  },
  'maternity-wear': {
    title: 'Maternity Kurtis & Ethnic Wear Online',
    description:
      'Shop comfortable maternity kurtis & ethnic wear at Kurtis Boutique. Stylish pregnancy wear designed for Indian moms. Free delivery & COD.',
    keywords: [
      'maternity kurtis',
      'maternity ethnic wear',
      'pregnancy wear Indian',
      'maternity kurtas online',
    ],
  },
  'combo-sets': {
    title: 'Family & Couple Combo Sets Online',
    description:
      'Shop matching family combo sets, couple sets & sibling twinning collections at Kurtis Boutique. Perfect for occasions & photo shoots.',
    keywords: [
      'family combo sets',
      'couple matching sets',
      'sibling combo',
      'twinning outfits India',
      'mom baby matching',
    ],
  },
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const seo = categorySEO[params.slug];
  if (!seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: `/collections/${params.slug}`,
    },
    openGraph: {
      title: `${seo.title} | Kurtis Boutique`,
      description: seo.description,
      url: `https://kurtisboutique.in/collections/${params.slug}`,
    },
  };
}


// ============================================================
// FILE: app/products/[slug]/page.tsx (PRODUCT PAGE SCHEMA)
// ============================================================
// Example: Dynamic product schema for each product page

function ProductSchema({ product }: { product: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    brand: { '@type': 'Brand', name: 'Kurtis Boutique' },
    category: "Women's Ethnic Wear",
    color: product.color,
    material: product.fabric,
    offers: {
      '@type': 'Offer',
      url: `https://kurtisboutique.in/products/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2026-12-31',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': 'https://kurtisboutique.in/#organization' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'd' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'd' },
        },
      },
    },
    // Only include if you have real reviews
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


// ============================================================
// FILE: next-sitemap.config.js (AUTO-GENERATE SITEMAP)
// ============================================================
// Install: npm install next-sitemap
// Add to package.json scripts: "postbuild": "next-sitemap"

/** @type {import('next-sitemap').IConfig} */
const nextSitemapConfig = {
  siteUrl: 'https://kurtisboutique.in',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/checkout/*', '/cart', '/account/*', '/admin/*'],
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/checkout/', '/cart/', '/account/', '/admin/', '/_next/'] },
    ],
  },
  transform: async (config: any, path: string) => {
    // Custom priority for different page types
    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.startsWith('/collections/')) {
      priority = 0.9;
    } else if (path.startsWith('/products/')) {
      priority = 0.8;
    } else if (['/about', '/contact'].includes(path)) {
      priority = 0.6;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};

// module.exports = nextSitemapConfig;


// ============================================================
// FILE: next.config.js (SEO-RELATED SETTINGS)
// ============================================================
// Add these SEO-friendly settings to your next.config.js:

const nextConfigSEO = {
  // Trailing slash consistency (pick one and stick with it)
  trailingSlash: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },

  // Security & SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Redirect www to non-www (or vice versa) for SEO
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kurtisboutique.in' }],
        destination: 'https://kurtisboutique.in/:path*',
        permanent: true,
      },
    ];
  },
};
