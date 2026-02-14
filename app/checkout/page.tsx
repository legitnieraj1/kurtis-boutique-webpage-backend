
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import Script from 'next/script';

import { PaymentProcessingLoader } from '@/components/orders/PaymentProcessingLoader';
import { LoadingScreen } from "@/components/ui/LoadingScreen";

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
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    notes: Record<string, string>;
    theme: {
        color: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayInstance {
    open: () => void;
    close: () => void;
}

export default function CheckoutPage() {
    const { cart, isAuthenticated, isLoading, cartLoading, getCartTotal, syncCart, clearCart } = useStore();
    const router = useRouter();
    const [isInitiating, setIsInitiating] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    // Separate effect for auth check - only run when auth loading is done
    useEffect(() => {
        // Don't check until auth loading is complete
        if (isLoading) return;

        // If not authenticated after auth check completes, redirect to login
        if (!isAuthenticated) {
            console.log('[Checkout] Not authenticated, redirecting to login');
            router.push('/login?redirect=/checkout');
            return;
        }

        // Only sync cart when authenticated
        syncCart();
    }, [isLoading, isAuthenticated, router, syncCart]);


    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [billingData, setBillingData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [shippingCost, setShippingCost] = useState<number | null>(null);
    const [isCheckingShipping, setIsCheckingShipping] = useState(false);

    // Debounce effect for pincode change
    useEffect(() => {
        const checkShipping = async () => {
            if (formData.pincode.length === 6) {
                setIsCheckingShipping(true);
                try {
                    const res = await fetch(`/api/shiprocket/check-serviceability?delivery_postcode=${formData.pincode}&cod=0`);
                    const data = await res.json();
                    if (data.success) {
                        setShippingCost(data.shipping_cost);
                    } else {
                        // Fallback or error
                        setShippingCost(getCartTotal() >= 999 ? 0 : 99);
                    }
                } catch (error) {
                    console.error('Failed to check shipping:', error);
                    setShippingCost(getCartTotal() >= 999 ? 0 : 99);
                } finally {
                    setIsCheckingShipping(false);
                }
            } else {
                setShippingCost(null);
            }
        };

        const timeoutId = setTimeout(checkShipping, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.pincode, getCartTotal]);


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

        // Basic validation
        if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
            toast.error("Please fill in all shipping details");
            return;
        }
        if (!sameAsShipping) {
            if (!billingData.name || !billingData.phone || !billingData.address || !billingData.city || !billingData.state || !billingData.pincode) {
                toast.error("Please fill in all billing details");
                return;
            }
        }

        setIsInitiating(true);

        try {
            const finalBillingData = sameAsShipping ? formData : billingData;

            // PREPAID FLOW (Razorpay) - ONLY OPTION NOW
            if (!razorpayLoaded) {
                toast.error("Payment system is loading, please try again");
                return;
            }

            console.log('[Checkout] Starting Razorpay checkout...');
            const response = await fetch('/api/checkout/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingAddress: formData,
                    billingAddress: finalBillingData,
                    sameAsShipping
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
                name: 'Kurtis Store',
                description: 'Order Payment',
                order_id: data.razorpayOrderId,
                handler: async function (response: RazorpayResponse) {
                    console.log('[Checkout] Payment successful:', response);
                    setIsProcessingPayment(true); // Show loader immediately after payment

                    try {
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
                            })
                        });
                        const verifyData = await verifyResponse.json();
                        if (verifyData.success) {
                            toast.success('Payment successful! Redirecting...');
                            clearCart();
                            router.push(`/checkout/success?order_id=${verifyData.orderNumber}`);
                        } else {
                            // If verification failed server-side
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
                    name: data.prefill?.name || formData.name,
                    email: data.prefill?.email || '',
                    contact: data.prefill?.contact || formData.phone,
                },
                notes: { orderId: data.orderId },
                theme: { color: '#7c3aed' },
                modal: {
                    ondismiss: function () {
                        setIsInitiating(false);
                        toast.info('Payment cancelled');
                    }
                }
            };
            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('[Checkout] ❌ Exception:', error);
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsInitiating(false);
        }
    };

    if (!hydrated || isLoading || cartLoading) {
        return (
            <LoadingScreen
                text="Loading checkout..."
                startTime={2}
                endTime={6}
            />
        );
    }

    const subtotal = getCartTotal();

    return (
        <>
            {isProcessingPayment && <PaymentProcessingLoader />}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
            />
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">Checkout</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Column: Shipping & Billing Details */}
                        <div className="space-y-6">
                            {/* Shipping Address */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-medium mb-6">Shipping Address</h2>
                                <form ref={formRef} id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                            placeholder="10-digit mobile number"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address (House No, Building, Street)</label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            required
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                            placeholder="Full address"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                required
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                required
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode</label>
                                        <input
                                            type="text"
                                            id="pincode"
                                            name="pincode"
                                            required
                                            value={formData.pincode}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                            placeholder="6-digit pincode"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Billing Address Toggle */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center mb-4">
                                    <input
                                        id="same-as-shipping"
                                        name="same-as-shipping"
                                        type="checkbox"
                                        checked={sameAsShipping}
                                        onChange={(e) => setSameAsShipping(e.target.checked)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="same-as-shipping" className="ml-2 block text-sm text-gray-900">
                                        Billing address same as shipping
                                    </label>
                                </div>

                                {!sameAsShipping && (
                                    <div className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <h2 className="text-xl font-medium mb-4">Billing Address</h2>
                                        {/* Billing fields ... (retained) */}
                                        <div>
                                            <label htmlFor="billing-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                            <input
                                                type="text"
                                                id="billing-name"
                                                name="name"
                                                required={!sameAsShipping}
                                                value={billingData.name}
                                                onChange={handleBillingChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                                placeholder="Enter billing name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="billing-phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <input
                                                type="tel"
                                                id="billing-phone"
                                                name="phone"
                                                required={!sameAsShipping}
                                                value={billingData.phone}
                                                onChange={handleBillingChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                                placeholder="Billing phone number"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="billing-address" className="block text-sm font-medium text-gray-700">Address</label>
                                            <input
                                                type="text"
                                                id="billing-address"
                                                name="address"
                                                required={!sameAsShipping}
                                                value={billingData.address}
                                                onChange={handleBillingChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                                placeholder="Billing address"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="billing-city" className="block text-sm font-medium text-gray-700">City</label>
                                                <input
                                                    type="text"
                                                    id="billing-city"
                                                    name="city"
                                                    required={!sameAsShipping}
                                                    value={billingData.city}
                                                    onChange={handleBillingChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="billing-state" className="block text-sm font-medium text-gray-700">State</label>
                                                <input
                                                    type="text"
                                                    id="billing-state"
                                                    name="state"
                                                    required={!sameAsShipping}
                                                    value={billingData.state}
                                                    onChange={handleBillingChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="billing-pincode" className="block text-sm font-medium text-gray-700">Pincode</label>
                                            <input
                                                type="text"
                                                id="billing-pincode"
                                                name="pincode"
                                                required={!sameAsShipping}
                                                value={billingData.pincode}
                                                onChange={handleBillingChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                                placeholder="Billing pincode"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Selection - SIMPLIFIED SHOWING ONLY PREPAID */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-medium mb-4">Payment Method</h2>
                                <div className="space-y-3">
                                    <div
                                        className="flex items-center justify-between p-4 border border-primary bg-primary/5 ring-1 ring-primary rounded-lg cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center">
                                                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                                            </div>
                                            <span className="font-medium">Online Payment (Cards, UPI, Netbanking)</span>
                                        </div>
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                    </div>
                                    {/* COD OPTION REMOVED */}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                                <h2 className="text-xl font-medium mb-6">Order Summary</h2>
                                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 py-4 border-b last:border-0 border-gray-100">
                                            <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                {item.product?.images?.[0]?.image_url ? (
                                                    <Image
                                                        src={item.product.images[0].image_url}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 line-clamp-1">{item.product?.name}</h3>
                                                <div className="flex justify-between mt-1">
                                                    <p className="text-sm text-gray-500">Size: {item.size}</p>
                                                    <p className="text-sm font-medium">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-semibold mt-1">
                                                    {formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                        <p>Subtotal</p>
                                        <p>{formatPrice(subtotal)}</p>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <p>Shipping</p>
                                        <p>
                                            {isCheckingShipping ? (
                                                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Calc...</span>
                                            ) : shippingCost !== null ? (
                                                shippingCost === 0 ? 'Free' : formatPrice(shippingCost)
                                            ) : (
                                                'Enter Pincode'
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                                        <p>Total</p>
                                        <p>{formatPrice(subtotal + (shippingCost || 0))}</p>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => formRef.current?.requestSubmit()}
                                    disabled={isInitiating || cart.length === 0 || !razorpayLoaded}
                                    className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-md shadow-lg transition-all"
                                >
                                    {isInitiating ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        !razorpayLoaded ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Loading...
                                            </>
                                        ) : "Pay Now"
                                    )}
                                </Button>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <ShieldCheck className="h-4 w-4 text-green-600" />
                                        <span>Secured by Razorpay</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        <span>Cards, UPI, Wallets & More</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
