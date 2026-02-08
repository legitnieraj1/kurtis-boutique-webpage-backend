"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/types";

export function NotificationBell() {
    const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch products to check for low stock
        // Ideally API could have /api/products/alerts or similar
        fetch('/api/products?limit=100')
            .then(res => res.json())
            .then(data => {
                if (data.products) {
                    const low = data.products.filter((p: Product) =>
                        p.stock_remaining <= 5 && p.is_active
                    );
                    setLowStockItems(low);
                }
            })
            .catch(console.error);
    }, []);

    const hasNotifications = lowStockItems.length > 0;

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-stone-100 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-stone-800">Notifications</h3>
                        {hasNotifications && (
                            <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                                {lowStockItems.length} Alert{lowStockItems.length !== 1 && 's'}
                            </span>
                        )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {lowStockItems.length === 0 ? (
                            <div className="px-4 py-8 text-center text-stone-500">
                                <p className="text-sm">All good! No alerts.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-stone-50">
                                {lowStockItems.map((product) => (
                                    <li key={product.id}>
                                        <Link
                                            href="/admin/products"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 hover:bg-stone-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-medium text-stone-800 line-clamp-1">{product.name}</p>
                                                <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                                    {product.stock_remaining} left
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500">
                                                Stock is running low. Restock soon.
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {hasNotifications && (
                        <div className="p-2 border-t border-stone-100 bg-stone-50/50">
                            <Link
                                href="/admin/products"
                                onClick={() => setIsOpen(false)}
                                className="block text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1"
                            >
                                View All Products
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
