import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
                <h1 className="text-3xl font-serif font-bold mb-8">Exchange & Shipping Policy</h1>

                <div className="prose prose-stone prose-sm md:prose-base max-w-none space-y-8 text-foreground/80">
                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">Shipping Policy</h2>
                        <p>
                            We offer free standard shipping on all orders above ₹999 across India. working days.
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Processing Time:</strong> Orders are processed within 24-48 hours.</li>
                            <li><strong>Delivery Time:</strong> Standard delivery takes 3-7 business days depending on your location.</li>
                            <li><strong>Tracking:</strong> Once shipped, you will receive a tracking number via email/SMS.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">International Shipping</h2>
                        <p>
                            Currently, we only ship within India. Stay tuned for international shipping updates!
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">Exchange & Returns</h2>
                        <p>
                            We want you to love your purchase. If you are not completely satisfied, we offer an easy exchange policy within 7 days of delivery.
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Eligibility:</strong> Items must be unused, unwashed, and in original packaging with tags intact.</li>
                            <li><strong>Process:</strong> To initiate an exchange, please email us at support@kurtisboutique.com with your order number.</li>
                            <li><strong>Requirement:</strong> A 360-degree unboxing video is mandatory for any damage or missing item claims.</li>
                            <li><strong>Refunds:</strong> We currently offer store credit or exchanges only; cash refunds are processed only for defective items.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">Damaged Items</h2>
                        <p>
                            In the rare case that you receive a damaged or incorrect item, please notify us within 48 hours of delivery for an immediate replacement.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
