import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Designer Kurtis & Ethnic Wear Online India | Kurtis Boutique",
  description:
    "Browse and buy designer kurtis, kurti sets, cotton kurtis, festive kurti collections, co-ords, maternity wear, mom baby combo outfits, and family combo ethnic wear at Kurtis Boutique. Trusted online boutique with 30K+ Instagram followers. Free delivery & COD across India.",
  keywords: [
    "shop kurtis online",
    "buy kurtis online india",
    "designer kurtis online",
    "boutique kurtis online india",
    "cotton kurtis online",
    "designer kurti sets",
    "festive kurti collection",
    "kurti sets for women",
    "ethnic wear boutique online",
    "matching mom baby outfits",
    "family combo ethnic wear",
    "Anarkali kurtas",
    "co-ord sets women",
    "maternity wear online",
    "festive wear kurtis",
    "party wear kurtis India",
    "kurtis boutique online",
    "kurti boutique online store",
    "affordable kurtis online",
  ],
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop Designer Kurtis & Ethnic Wear Online | Kurtis Boutique India",
    description:
      "Explore our collection of designer kurtis, kurti sets, cotton kurtis, festive wear, mom baby combos & family combo ethnic wear. Trusted boutique brand. Free delivery & COD available across India.",
    url: "https://kurtisboutique.in/shop",
    siteName: "Kurtis Boutique",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/kurtis-logo-large.png",
        width: 512,
        height: 512,
        alt: "Shop Designer Kurtis Online at Kurtis Boutique India - Ethnic Wear Boutique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Designer Kurtis & Ethnic Wear Online | Kurtis Boutique India",
    description:
      "Browse designer kurtis, kurti sets, cotton kurtis, festive collections & more at Kurtis Boutique. Free delivery & COD across India.",
    images: ["/kurtis-logo-large.png"],
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
