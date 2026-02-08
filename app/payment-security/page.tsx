import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, Lock, CreditCard } from "lucide-react";

export default function PaymentSecurity() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
                <div className="text-center mb-16 space-y-4">
                    <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
                    <h1 className="text-3xl md:text-5xl font-serif font-bold">100% Secure Payments</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Your security is our top priority. We use industry-standard encryption to ensure your personal and payment information is always protected.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-secondary/20 p-8 rounded-lg text-center space-y-4">
                        <Lock className="w-10 h-10 mx-auto text-primary" />
                        <h3 className="font-serif text-xl font-bold">SSL Encryption</h3>
                        <p className="text-sm text-muted-foreground">
                            Our entire website is secured with 256-bit SSL encryption, ensuring that all data transmitted properly is safe.
                        </p>
                    </div>
                    <div className="bg-secondary/20 p-8 rounded-lg text-center space-y-4">
                        <CreditCard className="w-10 h-10 mx-auto text-primary" />
                        <h3 className="font-serif text-xl font-bold">Safe Transactions</h3>
                        <p className="text-sm text-muted-foreground">
                            We partner with trusted payment gateways (Razorpay, Stripe) that comply with the highest security standards (PCI-DSS).
                        </p>
                    </div>
                    <div className="bg-secondary/20 p-8 rounded-lg text-center space-y-4">
                        <ShieldCheck className="w-10 h-10 mx-auto text-primary" />
                        <h3 className="font-serif text-xl font-bold">Data Privacy</h3>
                        <p className="text-sm text-muted-foreground">
                            We never store your full credit/debit card details on our servers. Your payment data is handled securely by our payment partners.
                        </p>
                    </div>
                </div>

                <div className="text-center border-t border-border pt-12">
                    <h3 className="font-medium mb-4">Accepted Payment Methods</h3>
                    <div className="flex gap-4 justify-center text-2xl text-muted-foreground grayscale opacity-70">
                        {/* Mock logos text */}
                        <span className="font-bold">VISA</span>
                        <span className="font-bold">Mastercard</span>
                        <span className="font-bold">UPI</span>
                        <span className="font-bold">RuPay</span>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
