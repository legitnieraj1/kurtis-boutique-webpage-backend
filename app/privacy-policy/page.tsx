import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
                <h1 className="text-3xl font-serif font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-stone prose-sm md:prose-base max-w-none space-y-8 text-foreground/80">
                    <p>Last updated: January 2026</p>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">1. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us, such as when you create an account, make a purchase, sign up for our newsletter, or contact us for support. This may include your name, email address, shipping address, payment information, and phone number.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Process and fulfill your orders.</li>
                            <li>Communicate with you about your account or transactions.</li>
                            <li>Send you newsletters and promotional materials (you can opt out at any time).</li>
                            <li>Improve our website and customer service.</li>
                            <li>Detect and prevent fraud.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">3. Sharing of Information</h2>
                        <p>
                            We do not sell your personal information. We may share your information with third-party service providers who assist us with payment processing, shipping, and marketing. These providers are obligated to protect your information and only use it for the services they provide to us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">4. Security</h2>
                        <p>
                            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-foreground mb-4">5. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at hello@kurtisboutique.com.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
