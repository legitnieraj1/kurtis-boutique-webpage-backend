import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Kurtis, Ethnic Wear & Co-ords Online",
  description:
    "Browse designer kurtis, kurta sets, co-ords, festive wear & maternity collections at Kurtis Boutique. Filter by category, price & size. Free delivery & COD across India.",
  keywords: [
    "shop kurtis online",
    "buy ethnic wear India",
    "designer kurtis",
    "cotton kurtis online",
    "Anarkali kurtas",
    "co-ord sets women",
    "maternity wear online",
    "festive wear kurtis",
    "party wear kurtis India",
    "affordable kurtis online",
  ],
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop Kurtis & Ethnic Wear Online | Kurtis Boutique India",
    description:
      "Explore our collection of designer kurtis, co-ords, festive wear & more. Free delivery & COD available.",
    url: "https://kurtisboutique.in/shop",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
