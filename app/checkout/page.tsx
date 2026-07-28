"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Script from 'next/script';
import { getCartItemPrice } from '@/lib/cartService';
import { PaymentProcessingLoader } from '@/components/orders/PaymentProcessingLoader';
import { getSupabaseClient } from '@/lib/supabase/client';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill: { name: string; email: string; contact: string };
    notes: Record<string, string>;
    theme: { color: string };
    modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

const COMBO_LABELS: Record<string, string> = {
    mom_baby: 'Mom & Baby Combo',
    family: 'Family Combo',
    couple: 'Couples Combo',
    baby_only: 'Baby Only',
};

interface RazorpayInstance {
    open: () => void;
    close: () => void;
}

export default function CheckoutPage() {
    const { cart, getCartTotal, clearCart, syncCart } = useStore();
    const router = useRouter();
    const [isInitiating, setIsInitiating] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [billingData, setBillingData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [shippingCost, setShippingCost] = useState<number | null>(null);
    const [isCheckingShipping, setIsCheckingShipping] = useState(false);

    useEffect(() => {
        setHydrated(true);
        syncCart();
    }, [syncCart]);

    // Debounce pincode check
    useEffect(() => {
        const checkShipping = async () => {
            if (formData.pincode.length === 6) {
                setIsCheckingShipping(true);
                try {
                    const res = await fetch(`/api/settings/shipping?pincode=${formData.pincode}`);
                    const data = await res.json();
                    setShippingCost(typeof data.shipping_cost === 'number' ? data.shipping_cost : 150);
                } catch {
                    setShippingCost(150);
                } finally {
                    setIsCheckingShipping(false);
                }
            } else {
                setShippingCost(null);
            }
        };
        const id = setTimeout(checkShipping, 1000);
        return () => clearTimeout(id);
    }, [formData.pincode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingData(prev => ({ ...prev, [name]: value }));
    };

    const formRef = useRef<HTMLFormElement>(null);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
            toast.error("Please fill in all shipping details");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!/^\d{10}$/.test(formData.phone)) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        if (!sameAsShipping && (!billingData.name || !billingData.phone || !billingData.address || !billingData.city || !billingData.state || !billingData.pincode)) {
            toast.error("Please fill in all billing details");
            return;
        }

        if (!razorpayLoaded) {
            toast.error("Payment system is loading, please try again");
            return;
        }

        setIsInitiating(true);

        try {
            const finalBillingData = sameAsShipping ? formData : billingData;

            // Serialize cart for API
            const cartPayload = cart.map(item => ({
                product_id: item.product_id,
                size: item.size,
                quantity: item.quantity,
                color: item.color || null,
                combo_type: item.combo_type || 'single',
                baby_size: item.baby_size || null,
                unit_price: getCartItemPrice(item),
                product_name: item.product?.name || '',
                product_image: item.product?.images?.[0]?.image_url || null,
            }));

            const response = await fetch('/api/checkout/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingAddress: formData,
                    billingAddress: finalBillingData,
                    sameAsShipping,
                    cartItems: cartPayload,
                    customerEmail: formData.email,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Failed to initiate checkout');
                return;
            }

            const options: RazorpayOptions = {
                key: data.razorpayKeyId,
                amount: data.amount,
                currency: data.currency,
                name: 'Kurtis Boutique',
                description: 'Order Payment',
                order_id: data.razorpayOrderId,
                handler: async function (response: RazorpayResponse) {
                    setIsProcessingPayment(true);

                    try {
                        // Get current anonymous/logged-in user ID from client session.
                        // This is the most reliable source — avoids server-side cookie issues.
                        let currentUserId: string | undefined;
                        try {
                            const sb = getSupabaseClient();
                            const { data: { session } } = await sb.auth.getSession();
                            currentUserId = session?.user?.id;
                        } catch { /* continue without userId */ }

                        const verifyResponse = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: data.orderId,
                                shippingAddress: formData,
                                billingAddress: finalBillingData,
                                cartItems: cartPayload,
                                customerEmail: formData.email,
                                userId: currentUserId,        // avoids server cookie lookup failure
                                shippingCost: data.shippingCost, // exact amount charged at initiate
                            })
                        });
                        const verifyData = await verifyResponse.json();
                        if (verifyData.success) {
                            toast.success('Payment successful! Redirecting...');
                            await clearCart();
                            router.push(`/checkout/success?order_id=${verifyData.orderNumber}`);
                        } else {
                            toast.error(verifyData.error || 'Payment verification failed');
                            router.push('/checkout/cancel?reason=failed');
                        }
                    } catch (error) {
                        console.error('[Checkout] Verification error:', error);
                        toast.error('Payment verification failed. Please contact support.');
                        router.push('/checkout/cancel?reason=failed');
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: { orderId: data.orderId },
                theme: { color: '#7c3aed' },
                modal: {
                    ondismiss: () => {
                        setIsInitiating(false);
                        toast.info('Payment cancelled');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('[Checkout] Exception:', error);
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsInitiating(false);
        }
    };

    if (!hydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const subtotal = getCartTotal();

    // 16px base prevents iOS zooming the viewport when a field is focused
    const inputClass = "mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
    const labelClass = "block text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium";

    return (
        <>
            {isProcessingPayment && <PaymentProcessingLoader />}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
            />
            <div className="min-h-screen bg-background pb-28 lg:pb-12">
                {/* Brand header — checkout is where trust matters most, and the page
                    previously carried no identity at all. */}
                <header className="border-b border-border bg-surface">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <Link href="/" aria-label="Kurtis Boutique home">
                            <img src="/kurtis-logo-large.png" alt="Kurtis Boutique" className="h-14 w-auto object-contain" />
                        </Link>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Lock className="w-3.5 h-3.5 text-success" />
                            Secure Checkout
                        </span>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {/* Progress — orients the buyer and signals how little is left */}
                    <ol className="flex items-center justify-center gap-3 sm:gap-5 mb-8 text-xs">
                        {["Details", "Review", "Pay"].map((label, i) => (
                            <li key={label} className="flex items-center gap-3 sm:gap-5">
                                <span className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold",
                                        i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    )}>
                                        {i + 1}
                                    </span>
                                    <span className={cn("tracking-wide", i === 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                                        {label}
                                    </span>
                                </span>
                                {i < 2 && <span className="w-6 sm:w-10 h-px bg-border" />}
                            </li>
                        ))}
                    </ol>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Shipping Address */}
                            <div className="bg-surface rounded-xl border border-border shadow-[var(--shadow-soft)] p-6">
                                <h2 className="text-lg font-serif text-foreground mb-5">Shipping Details</h2>
                                <form ref={formRef} id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className={labelClass}>Full Name</label>
                                        <input type="text" id="name" name="name" required value={formData.name} onChange={handleInputChange} className={inputClass} placeholder="Enter your full name" />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className={labelClass}>Email Address</label>
                                        <input type="email" id="email" name="email" required value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="your@email.com" />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className={labelClass}>Mobile Number</label>
                                        <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="10-digit mobile number" maxLength={10} />
                                    </div>

                                    <div>
                                        <label htmlFor="address" className={labelClass}>Address (House No, Building, Street)</label>
                                        <input type="text" id="address" name="address" required value={formData.address} onChange={handleInputChange} className={inputClass} placeholder="Full address" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="city" className={labelClass}>City</label>
                                            <input type="text" id="city" name="city" required value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="City" />
                                        </div>
                                        <div>
                                            <label htmlFor="state" className={labelClass}>State</label>
                                            <input type="text" id="state" name="state" required value={formData.state} onChange={handleInputChange} className={inputClass} placeholder="State" />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="pincode" className={labelClass}>Pincode</label>
                                        <input type="text" id="pincode" name="pincode" required value={formData.pincode} onChange={handleInputChange} className={inputClass} placeholder="6-digit pincode" maxLength={6} />
                                    </div>
                                </form>
                            </div>

                            {/* Billing Address Toggle */}
                            <div className="bg-surface rounded-xl border border-border shadow-[var(--shadow-soft)] p-6">
                                <div className="flex items-center mb-4">
                                    <input
                                        id="same-as-shipping"
                                        type="checkbox"
                                        checked={sameAsShipping}
                                        onChange={(e) => setSameAsShipping(e.target.checked)}
                                        className="h-4 w-4 accent-primary rounded border-border"
                                    />
                                    <label htmlFor="same-as-shipping" className="ml-2 block text-sm text-foreground">
                                        Billing address same as shipping
                                    </label>
                                </div>

                                {!sameAsShipping && (
                                    <div className="space-y-4 pt-4 border-t border-border animate-in slide-in-from-top-2 fade-in duration-300">
                                        <h2 className="text-xl font-medium mb-4">Billing Address</h2>
                                        <div>
                                            <label className={labelClass}>Full Name</label>
                                            <input type="text" name="name" required={!sameAsShipping} value={billingData.name} onChange={handleBillingChange} className={inputClass} placeholder="Billing name" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            <input type="tel" name="phone" required={!sameAsShipping} value={billingData.phone} onChange={handleBillingChange} className={inputClass} placeholder="Billing phone" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Address</label>
                                            <input type="text" name="address" required={!sameAsShipping} value={billingData.address} onChange={handleBillingChange} className={inputClass} placeholder="Billing address" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>City</label>
                                                <input type="text" name="city" required={!sameAsShipping} value={billingData.city} onChange={handleBillingChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>State</label>
                                                <input type="text" name="state" required={!sameAsShipping} value={billingData.state} onChange={handleBillingChange} className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Pincode</label>
                                            <input type="text" name="pincode" required={!sameAsShipping} value={billingData.pincode} onChange={handleBillingChange} className={inputClass} placeholder="Billing pincode" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="bg-surface rounded-xl border border-border shadow-[var(--shadow-soft)] p-6">
                                <h2 className="text-xl font-medium mb-4">Payment Method</h2>
                                <div className="flex items-center justify-between p-4 border border-primary bg-primary/5 ring-1 ring-primary rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full border border-border flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                                        </div>
                                        <span className="font-medium">Online Payment (Cards, UPI, Netbanking)</span>
                                    </div>
                                    <ShieldCheck className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Order Summary — sticky so the total and Pay
                            button stay in view while the form is filled in. */}
                        <div className="space-y-6">
                            <div className="bg-surface rounded-xl border border-border shadow-[var(--shadow-soft)] p-6 lg:sticky lg:top-8">
                                <h2 className="text-lg font-serif text-foreground mb-5">Order Summary</h2>

                                {cart.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">Your cart is empty. <a href="/shop" className="text-primary underline">Shop now</a></p>
                                ) : (
                                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex gap-3.5 py-4 border-b last:border-0 border-border">
                                                <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                    {item.product?.images?.[0]?.image_url ? (
                                                        <Image src={item.product.images[0].image_url} alt={item.product.name || ''} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-serif text-sm text-foreground line-clamp-1">{item.product?.name}</h3>
                                                    <div className="flex justify-between mt-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Size: {item.size}
                                                            {item.color && ` | Color: ${item.color.includes('|') ? item.color.split('|')[0] : item.color}`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                    {item.combo_type && item.combo_type !== 'single' && COMBO_LABELS[item.combo_type] && (
                                                        <span className="inline-block text-[11px] font-medium text-primary bg-secondary px-2 py-0.5 rounded-full mt-1.5">
                                                            {COMBO_LABELS[item.combo_type]}
                                                        </span>
                                                    )}
                                                    <p className="text-sm font-semibold mt-1.5 tabular-nums text-foreground">
                                                        {formatPrice(getCartItemPrice(item) * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2.5 pt-4 border-t border-border">
                                    <div className="flex justify-between text-sm">
                                        <p className="text-muted-foreground">Subtotal</p>
                                        <p className="tabular-nums text-foreground">{formatPrice(subtotal)}</p>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <p className="text-muted-foreground">Shipping</p>
                                        <div className="text-right">
                                            {isCheckingShipping ? (
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Calculating
                                                </span>
                                            ) : shippingCost !== null ? (
                                                <span className={cn("tabular-nums", shippingCost === 0 ? "text-success font-medium" : "text-foreground")}>
                                                    {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Enter pincode to calculate</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-border">
                                        <p className="font-medium text-foreground">Total</p>
                                        <p className="text-2xl font-semibold tabular-nums text-foreground">
                                            {formatPrice(subtotal + (shippingCost || 0))}
                                        </p>
                                    </div>
                                </div>

                                {/* Naming the amount on the button removes the last
                                    moment of doubt about what will be charged. */}
                                <Button
                                    type="button"
                                    onClick={() => formRef.current?.requestSubmit()}
                                    disabled={isInitiating || cart.length === 0 || !razorpayLoaded}
                                    className="w-full mt-6 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-[15px] tracking-[0.06em] uppercase shadow-[var(--shadow-lift)] transition-all duration-300 active:scale-[0.99]"
                                >
                                    {isInitiating ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing…</>
                                    ) : !razorpayLoaded ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</>
                                    ) : (
                                        <>Pay {formatPrice(subtotal + (shippingCost || 0))}</>
                                    )}
                                </Button>

                                <div className="mt-4 space-y-2">
                                    <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <ShieldCheck className="h-3.5 w-3.5 text-success" />
                                        256-bit secure payment via Razorpay
                                    </p>
                                    <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <CreditCard className="h-3.5 w-3.5 text-accent-brand" />
                                        UPI · Cards · Wallets · Net Banking
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
