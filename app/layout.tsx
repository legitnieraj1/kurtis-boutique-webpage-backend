import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kurtisboutique.in"),

  title: {
    default: "Kurtis Boutique | Designer Kurtis Online Store India",
    template: "%s | Kurtis Boutique India",
  },

  description:
    "Shop designer kurtis, kurti sets and ethnic wear online at Kurtis Boutique. Trusted boutique brand with 30K+ Instagram followers. Based in Bangalore, manufacturing in Madurai. Shipping across India. COD available.",

  keywords: [
    "kurtis boutique",
    "kurtis boutique online",
    "designer kurtis online",
    "buy kurtis online india",
    "ethnic wear boutique online",
    "boutique kurtis online india",
    "kurti sets for women",
    "kurti boutique online store",
    "kurtis boutique instagram",
    "kurtis boutique india",
    "kurtis boutique bangalore",
    "kurtis.boutique",
    "cotton kurtis online",
    "designer kurti sets",
    "festive kurti collection",
    "matching mom baby outfits",
    "family combo ethnic wear",
    "women ethnic wear online",
    "Anarkali kurtas",
    "co-ord sets women",
    "maternity kurtis",
    "affordable kurtis online India",
    "Indian fashion online",
    "ethnic wear shopping India",
    "A-line kurtis",
    "straight kurtas for women",
    "printed kurtis",
    "office wear kurtis",
    "casual kurtis online",
    "couple matching sets",
    "mom baby matching outfits",
    "party wear kurtis",
    "online boutique india",
    "boutique clothing india",
  ],

  authors: [{ name: "Kurtis Boutique", url: "https://kurtisboutique.in" }],
  creator: "Kurtis Boutique",
  publisher: "Kurtis Boutique",

  alternates: {
    canonical: "/",
    languages: { "en-IN": "/" },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://kurtisboutique.in",
    siteName: "Kurtis Boutique",
    title: "Kurtis Boutique | Designer Kurtis Online Store India",
    description:
      "Shop designer kurtis, kurti sets and ethnic wear online at Kurtis Boutique. Trusted boutique brand with 30K+ Instagram followers. Shipping across India.",
    images: [
      {
        url: "/kurtis-logo-large.png",
        width: 512,
        height: 512,
        alt: "Kurtis Boutique - Designer Kurtis Online Store India - Ethnic Wear Boutique",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kurtis Boutique | Designer Kurtis Online Store India",
    description:
      "Shop designer kurtis, kurti sets and ethnic wear online at Kurtis Boutique. Trusted boutique brand with 30K+ Instagram followers. Shipping across India.",
    images: ["/kurtis-logo-large.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    // Uncomment and add your codes after registering:
    // google: "YOUR_GOOGLE_SEARCH_CONSOLE_CODE",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/kurtis-logo-large.png",
  },

  manifest: "/site.webmanifest",

  category: "ecommerce",
};

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// JSON-LD Schema Markup for SEO
function SchemaMarkup() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://kurtisboutique.in/#organization",
    name: "Kurtis Boutique",
    alternateName: [
      "KurtisBoutique",
      "Kurtis Boutique India",
      "Boutique Kurtis",
      "kurtis.boutique",
      "Kurtis Boutique Bangalore",
    ],
    url: "https://kurtisboutique.in",
    logo: {
      "@type": "ImageObject",
      url: "https://kurtisboutique.in/kurtis-logo-large.png",
      width: 512,
      height: 512,
    },
    image: "https://kurtisboutique.in/kurtis-logo-large.png",
    description:
      "Kurtis Boutique is an online ethnic wear brand with over 30,000 followers on Instagram. Based in Bangalore with manufacturing in Madurai, the brand ships premium boutique clothing across India. Shop designer kurtis, kurti sets, festive wear, mom-baby combos, and family combo ethnic wear.",
    foundingLocation: {
      "@type": "Place",
      name: "Bangalore, Karnataka, India",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9787635982",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Tamil", "Kannada"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bangalore",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.instagram.com/kurtis.boutique/",
      "https://wa.me/919787635982",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://kurtisboutique.in/#website",
    name: "Kurtis Boutique",
    alternateName: "KurtisBoutique",
    url: "https://kurtisboutique.in",
    description:
      "Shop designer kurtis, kurti sets and ethnic wear online at Kurtis Boutique India. Trusted boutique brand with 30K+ Instagram followers.",
    publisher: { "@id": "https://kurtisboutique.in/#organization" },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://kurtisboutique.in/shop?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const clothingStoreSchema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": "https://kurtisboutique.in/#store",
    name: "Kurtis Boutique",
    url: "https://kurtisboutique.in",
    image: "https://kurtisboutique.in/kurtis-logo-large.png",
    description:
      "Kurtis Boutique is an online ethnic wear boutique offering designer kurtis, kurti sets, cotton kurtis, festive kurti collections, matching mom baby outfits, and family combo ethnic wear. Based in Bangalore with manufacturing in Madurai, shipping across India.",
    telephone: "+91-9787635982",
    currenciesAccepted: "INR",
    paymentAccepted: "Credit Card, Debit Card, UPI, Cash on Delivery, Net Banking, Razorpay",
    priceRange: "₹499 - ₹4999",
    areaServed: {
      "@type": "Country",
      name: "India",
      sameAs: "https://en.wikipedia.org/wiki/India",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bangalore",
      addressRegion: "Karnataka",
      postalCode: "560038",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "12.9716",
      longitude: "77.5946",
    },
    brand: {
      "@type": "Brand",
      name: "Kurtis Boutique",
      url: "https://kurtisboutique.in",
      logo: "https://kurtisboutique.in/kurtis-logo-large.png",
    },
    sameAs: [
      "https://www.instagram.com/kurtis.boutique/",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Women's Ethnic Wear Collection",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Designer Kurtis",
          description: "Designer kurtis including A-line, Anarkali, straight, and printed styles for women online India",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Cotton Kurtis",
          description: "Premium cotton kurtis online from Kurtis Boutique India",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Kurti Sets",
          description: "Designer kurti sets for women - coordinated ethnic wear sets",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Festive Kurti Collection",
          description: "Premium festive and party wear kurti collections for women",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Mom Baby Combo Outfits",
          description: "Matching mom and baby outfits - coordinated ethnic wear combos",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Family Combo Ethnic Wear",
          description: "Family combo sets, couple sets, and sibling matching ethnic wear collections",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Co-ord Sets",
          description: "Matching co-ord sets for women in ethnic and fusion styles",
          url: "https://kurtisboutique.in/shop",
        },
        {
          "@type": "OfferCatalog",
          name: "Maternity Wear",
          description: "Comfortable and stylish maternity ethnic wear kurtis",
          url: "https://kurtisboutique.in/shop",
        },
      ],
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://kurtisboutique.in/#localbusiness",
    name: "Kurtis Boutique",
    image: "https://kurtisboutique.in/kurtis-logo-large.png",
    url: "https://kurtisboutique.in",
    telephone: "+91-9787635982",
    description:
      "Kurtis Boutique is a premium ethnic wear boutique based in Bangalore, India. With manufacturing in Madurai and over 30,000+ Instagram followers, we offer designer kurtis, kurti sets, and ethnic wear online across India.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Fashion Street, Indiranagar",
      addressLocality: "Bangalore",
      addressRegion: "Karnataka",
      postalCode: "560038",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "12.9716",
      longitude: "77.5946",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:30",
        closes: "20:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "11:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      "https://www.instagram.com/kurtis.boutique/",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Kurtis Boutique?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kurtis Boutique is an online ethnic wear brand based in Bangalore, India with manufacturing in Madurai. We offer designer kurtis, kurti sets, cotton kurtis, festive kurti collections, matching mom baby outfits, and family combo ethnic wear. We ship across India with COD available.",
        },
      },
      {
        "@type": "Question",
        name: "Does Kurtis Boutique ship across India?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Kurtis Boutique ships to all pincodes across India. We offer nationwide shipping through trusted logistics partners. Cash on Delivery (COD) is also available on eligible orders.",
        },
      },
      {
        "@type": "Question",
        name: "Where is Kurtis Boutique located?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kurtis Boutique is based in Bangalore, Karnataka, India. Our manufacturing warehouse is located in Madurai, Tamil Nadu. You can shop online at kurtisboutique.in or follow us on Instagram @kurtis.boutique (30,000+ followers).",
        },
      },
      {
        "@type": "Question",
        name: "What types of kurtis can I buy from Kurtis Boutique?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can buy designer kurtis, cotton kurtis, Anarkali kurtas, kurti sets, co-ord sets, festive wear kurtis, party wear kurtis, maternity kurtis, matching mom baby combo outfits, family combo ethnic wear, couple matching sets, and sibling combos from Kurtis Boutique online.",
        },
      },
      {
        "@type": "Question",
        name: "How can I follow Kurtis Boutique on Instagram?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can follow Kurtis Boutique on Instagram at https://www.instagram.com/kurtis.boutique/. We have over 30,000 followers and regularly post new arrivals, styling tips, and behind-the-scenes content.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods does Kurtis Boutique accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kurtis Boutique accepts Credit Cards, Debit Cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD). All payments are processed securely through Razorpay.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://kurtisboutique.in/",
      },
    ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clothingStoreSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="light" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins for performance */}
        <link rel="preconnect" href="https://vabvgifhyktqloplhwtc.supabase.co" />
        <link rel="dns-prefetch" href="https://vabvgifhyktqloplhwtc.supabase.co" />
        {/* Instagram profile link for SEO authority */}
        <link rel="me" href="https://www.instagram.com/kurtis.boutique/" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased text-foreground relative min-h-screen`}
      >
        <SchemaMarkup />
        <div className="fixed inset-0 -z-10 bg-background pointer-events-none">
          <BackgroundGradientAnimation
            containerClassName="h-full w-full pointer-events-none"
            className="absolute inset-0"
            interactive={true}
            firstColor="128, 24, 72"
            secondColor="176, 84, 128"
            thirdColor="212, 140, 168"
            fourthColor="180, 120, 150"
            fifthColor="150, 60, 100"
            pointerColor="176, 84, 128"
            size="80%"
          />
        </div>
        <AuthProvider>
          <div className="relative z-0">
            {children}
          </div>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            className:
              "bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-xl p-4 flex gap-3 text-sm font-medium text-foreground ring-1 ring-black/5 !w-[350px]",
            classNames: {
              success: "text-green-700 bg-green-50/50 border-green-200/50",
              error: "text-red-700 bg-red-50/50 border-red-200/50",
              info: "text-blue-700 bg-blue-50/50 border-blue-200/50",
              warning: "text-yellow-700 bg-yellow-50/50 border-yellow-200/50",
              toast: "group-[.toaster]:bg-white/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-white/40 group-[.toaster]:shadow-xl",
              title: "group-[.toast]:font-serif group-[.toast]:text-base",
              description: "group-[.toast]:text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
