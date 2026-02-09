"use client";

import { motion } from "framer-motion";

export function OrderStatusAnimation() {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="relative w-48 h-48 flex items-center justify-center">

                {/* Sewing Machine Body Base */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-10 left-4 w-32 h-4 bg-stone-800 rounded-sm z-10"
                />

                {/* Machine Arm */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-10 left-4 w-8 h-32 bg-stone-800 rounded-sm z-10"
                />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-10 left-4 w-32 h-8 bg-stone-800 rounded-sm z-10"
                />

                {/* Needle Bar moving up and down */}
                <motion.div
                    animate={{ y: [0, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
                    className="absolute top-16 right-16 w-1 h-12 bg-stone-400 z-20"
                >
                    {/* Needle point */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-stone-300" />
                </motion.div>

                {/* Scissors (Abstract) */}
                <motion.div
                    className="absolute -right-8 bottom-12 text-rose-500"
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                </motion.div>

                {/* Thread / Fabric feed */}
                <motion.div
                    className="absolute bottom-14 left-10 w-24 h-1 bg-rose-300"
                    animate={{ x: [-5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
                />

            </div>

            <div className="text-center space-y-2">
                <h3 className="text-2xl font-serif font-bold text-stone-800">Your order is getting sewed!</h3>
                <p className="text-stone-500 max-w-xs mx-auto">
                    We are crafting your items with care. You will be notified once they are ready to ship.
                </p>
            </div>
        </div>
    );
}
