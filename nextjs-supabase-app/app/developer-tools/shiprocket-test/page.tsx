'use client';

import { useState } from 'react';

export default function ShiprocketTestPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreateTestOrder = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        const dummyOrder = {
            orderId: 'TEST-' + Math.floor(Math.random() * 10000), // Simulate internal DB ID
            orderData: {
                order_id: 'ORD-' + Date.now(),
                order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                pickup_location: 'Primary', // Must match your Shiprocket setup
                billing_customer_name: 'Test User',
                billing_last_name: 'Dev',
                billing_address: '123 Test St',
                billing_city: 'Delhi',
                billing_pincode: '110001',
                billing_state: 'Delhi',
                billing_country: 'India',
                billing_email: 'test@example.com',
                billing_phone: '9876543210',
                shipping_is_billing: true,
                order_items: [
                    {
                        name: 'Test Product',
                        sku: 'TEST-SKU-1',
                        units: 1,
                        selling_price: 100
                    }
                ],
                payment_method: 'Prepaid',
                sub_total: 100,
                length: 10,
                breadth: 10,
                height: 10,
                weight: 0.5
            }
        };

        try {
            const res = await fetch('/api/shiprocket/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dummyOrder),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Request failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-6">Shiprocket Integration Test</h1>

            <div className="bg-gray-100 p-6 rounded-lg mb-6">
                <h2 className="font-semibold mb-2">Instructions</h2>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Ensure <code>.env.local</code> has Shiprocket credentials.</li>
                    <li>Ensure DB tables are created (<code>orders</code>, <code>shipments</code>).</li>
                    <li>Click below to simulate a full order flow: Create Order &rarr; Assign AWB &rarr; Pickup &rarr; Label.</li>
                </ul>
            </div>

            <button
                onClick={handleCreateTestOrder}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Create Test Order'}
            </button>

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Success!</h3>
                    <div className="bg-slate-900 text-slate-50 p-4 rounded overflow-auto">
                        <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                    {result.label_url && (
                        <div className="mt-4">
                            <a
                                href={result.label_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline"
                            >
                                View Shipping Label
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
