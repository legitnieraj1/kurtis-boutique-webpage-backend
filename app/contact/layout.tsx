import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Kurtis Boutique. Reach us for order inquiries, product information, returns & exchanges. Visit us in Bangalore or message on WhatsApp & Instagram.",
  keywords: [
    "contact kurtis boutique",
    "kurtis boutique customer service",
    "kurtis boutique phone number",
    "kurtis boutique WhatsApp",
    "ethnic wear boutique Bangalore",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Kurtis Boutique | Customer Support",
    description:
      "Have questions? Reach out to Kurtis Boutique via phone, email, WhatsApp, or visit our store in Bangalore.",
    url: "https://kurtisboutique.in/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
