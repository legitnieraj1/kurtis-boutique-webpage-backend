import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Exchange & Shipping Policy",
    description:
        "Learn about Kurtis Boutique delivery timelines, exchange policy, and COD availability across India.",
    keywords: [
        "kurtis boutique shipping",
        "free delivery India",
        "exchange policy",
        "COD kurtis India",
        "return policy ethnic wear",
    ],
    alternates: { canonical: "/exchange-and-shipping" },
};

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
                <h1 className="text-3xl font-serif font-bold mb-8">Exchange & Shipping Policy</h1>

                <div className="prose prose-stone prose-sm md:prose-base max-w-none space-y-8 text-foreground/80">
                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">Shipping Policy</h2>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Processing Time:</strong> 3 to 7 working days</li>
                            <li><strong>Delivery Time:</strong> 5 to 10 working days</li>
                            <li><strong>Tracking:</strong> Once shipped, you will receive a tracking number via email/SMS.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">International Shipping</h2>
                        <p>
                            International shipping available - for international shipping DM us in Instagram or whatsapp us at <a href="https://wa.me/919787635982" className="text-primary hover:underline">9787635982</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">Exchange & Returns</h2>
                        <p>
                            <strong>No exchange or returns or cancellations accepted once order is placed.</strong>
                        </p>
                        <p className="mt-2">
                            Exchange can only be done if there are any damages found in the dress. To avail this, a 360 unboxing video is mandatory.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">Damaged Items</h2>
                        <p>
                            In the rare case that you receive a damaged product or incorrect item, please notify us within 24 hours of delivery for a replacement.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
