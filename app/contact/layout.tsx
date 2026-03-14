import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Kurtis Boutique - Get in Touch | Bangalore India",
    description:
        "Contact Kurtis Boutique for inquiries about designer kurtis, kurti sets, and ethnic wear orders. Based in Bangalore, India. WhatsApp: +91 9787635982. Follow us on Instagram @kurtis.boutique (30K+ followers).",
    keywords: [
        "contact kurtis boutique",
        "kurtis boutique bangalore",
        "kurtis boutique phone number",
        "kurtis boutique whatsapp",
        "kurtis boutique address",
        "kurtis boutique customer service",
        "ethnic wear store bangalore",
    ],
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact Kurtis Boutique - Bangalore India",
        description:
            "Get in touch with Kurtis Boutique for designer kurtis and ethnic wear inquiries. Based in Bangalore, shipping across India.",
        url: "https://kurtisboutique.in/contact",
        siteName: "Kurtis Boutique",
        locale: "en_IN",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Contact Kurtis Boutique - Bangalore India",
        description:
            "Contact Kurtis Boutique for designer kurtis and ethnic wear orders. WhatsApp: +91 9787635982.",
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
