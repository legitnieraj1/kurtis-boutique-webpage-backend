"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function PaymentProcessingLoader() {
    return (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mb-8"
            >
                {/* Glowing Effect Background */}
                <div className="absolute inset-0 bg-rose-200/50 rounded-full blur-3xl animate-pulse" />

                {/* Logo Container */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                    <Image
                        src="/mfp logoo.png" // Assuming this is the logo path based on prior context, fallback if not found
                        alt="Kurtis Boutique"
                        width={160}
                        height={160}
                        className="object-contain drop-shadow-xl"
                        priority
                    />
                </div>
            </motion.div>

            <div className="space-y-4 text-center z-10">
                <motion.h2
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-stone-800 via-rose-900 to-stone-800 bg-clip-text text-transparent"
                >
                    Payment Processing
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-stone-500 font-medium tracking-wide text-lg"
                >
                    Securing your exclusive order...
                </motion.p>

                {/* Luxurious Loading Bar */}
                <div className="w-64 h-1 bg-stone-100 rounded-full overflow-hidden mx-auto mt-8">
                    <motion.div
                        className="h-full bg-gradient-to-r from-rose-400 via-rose-600 to-rose-400"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
}
