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
    default: "Kurtis Boutique | Buy Designer Kurtis & Ethnic Wear Online India",
    template: "%s | Kurtis Boutique India",
  },

  description:
    "Shop premium designer kurtis, kurtas, co-ords & festive ethnic wear for women online at Kurtis Boutique India. Free delivery, COD available. Cotton kurtis, Anarkali kurtas, maternity wear & more.",

  keywords: [
    "kurtis boutique",
    "kurtisboutique",
    "boutique kurtis",
    "buy kurtis online India",
    "designer kurtis for women",
    "women ethnic wear online",
    "cotton kurtis",
    "Anarkali kurtas",
    "festive wear kurtis",
    "party wear kurtis",
    "co-ord sets women",
    "maternity kurtis",
    "affordable kurtis online India",
    "kurta sets for women",
    "Indian fashion online",
    "ethnic wear shopping India",
    "A-line kurtis",
    "straight kurtas for women",
    "printed kurtis",
    "office wear kurtis",
    "casual kurtis online",
    "family combo sets",
    "couple matching sets",
    "mom baby matching outfits",
  ],

  authors: [{ name: "Kurtis Boutique" }],

  alternates: {
    canonical: "/",
    languages: { "en-IN": "/" },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://kurtisboutique.in",
    siteName: "Kurtis Boutique",
    title: "Kurtis Boutique | Designer Kurtis & Ethnic Wear Online India",
    description:
      "Shop premium designer kurtis, kurtas, co-ords & festive ethnic wear for women. Free delivery & COD available across India.",
    images: [
      {
        url: "/kurtis-logo-large.png",
        width: 512,
        height: 512,
        alt: "Kurtis Boutique - Designer Ethnic Wear for Women",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kurtis Boutique | Designer Kurtis & Ethnic Wear Online India",
    description:
      "Shop premium designer kurtis, kurtas, co-ords & festive ethnic wear for women. Free delivery & COD available across India.",
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
};

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// JSON-LD Schema Markup for SEO
function SchemaMarkup() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://kurtisboutique.in/#organization",
    name: "Kurtis Boutique",
    alternateName: ["KurtisBoutique", "Kurtis Boutique India", "Boutique Kurtis"],
    url: "https://kurtisboutique.in",
    logo: {
      "@type": "ImageObject",
      url: "https://kurtisboutique.in/logo.png",
      width: 512,
      height: 512,
    },
    description:
      "Premium Indian women's boutique offering designer kurtis, kurtas, co-ords, festive wear, maternity wear, and family combo collections across India.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      // Add your actual social URLs here:
      // "https://www.instagram.com/kurtisboutique/",
      // "https://www.facebook.com/kurtisboutique/",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://kurtisboutique.in/#website",
    name: "Kurtis Boutique",
    alternateName: "KurtisBoutique",
    url: "https://kurtisboutique.in",
    publisher: { "@id": "https://kurtisboutique.in/#organization" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://kurtisboutique.in/shop?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": "https://kurtisboutique.in/#store",
    name: "Kurtis Boutique",
    url: "https://kurtisboutique.in",
    description:
      "Shop designer kurtis, ethnic wear, co-ords & festive collections for women online in India.",
    currenciesAccepted: "INR",
    paymentAccepted: "Credit Card, Debit Card, UPI, Cash on Delivery, Net Banking",
    priceRange: "₹₹",
    areaServed: { "@type": "Country", name: "India" },
    brand: { "@type": "Brand", name: "Kurtis Boutique" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Women's Ethnic Wear Collection",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Kurtis", description: "Designer kurtis including A-line, Anarkali, straight, and printed styles" },
        { "@type": "OfferCatalog", name: "Co-ord Sets", description: "Matching co-ord sets for women in ethnic and fusion styles" },
        { "@type": "OfferCatalog", name: "Festive Wear", description: "Premium festive and party wear collections for women" },
        { "@type": "OfferCatalog", name: "Maternity Wear", description: "Comfortable and stylish maternity ethnic wear" },
        { "@type": "OfferCatalog", name: "Combo Sets", description: "Family combo sets, couple sets, and sibling matching collections" },
      ],
    },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
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

