"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SizeChartPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#fdf2f5] px-4 py-8 md:py-12 pb-24 text-foreground selection:bg-pink-200">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 hover:bg-pink-100 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back to Order
                </Button>

                <h1 className="text-3xl md:text-5xl font-serif text-center mb-4 text-pink-950">Size Guide</h1>
                <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
                    Find the perfect fit for everyone. Refer to our detailed size charts below to ensure the best fit before placing your order.
                </p>

                <div className="space-y-16">
                    {/* Women Size Chart */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-pink-100/50 border border-pink-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 to-rose-400" />
                        <h2 className="text-2xl font-serif mb-6 text-center text-pink-900">Women's Size Chart</h2>
                        <div className="w-full relative aspect-auto md:aspect-[16/9] flex justify-center bg-stone-50 rounded-2xl overflow-hidden">
                            <img 
                                src="/size%20woman.png" 
                                alt="Women's Size Chart" 
                                className="w-full h-auto object-contain max-h-[70vh] hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Men Size Chart */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-pink-100/50 border border-pink-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 to-rose-400" />
                        <h2 className="text-2xl font-serif mb-6 text-center text-pink-900">Men's Size Chart</h2>
                        <div className="w-full relative aspect-auto md:aspect-[16/9] flex justify-center bg-stone-50 rounded-2xl overflow-hidden">
                            <img 
                                src="/size%20men.png" 
                                alt="Men's Size Chart" 
                                className="w-full h-auto object-contain max-h-[70vh] hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Baby Size Chart */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-pink-100/50 border border-pink-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 to-rose-400" />
                        <h2 className="text-2xl font-serif mb-6 text-center text-pink-900">Baby's Size Chart</h2>
                        <div className="w-full relative aspect-auto md:aspect-[16/9] flex justify-center bg-stone-50 rounded-2xl overflow-hidden">
                            <img 
                                src="/size%20baby.png" 
                                alt="Baby's Size Chart" 
                                className="w-full h-auto object-contain max-h-[70vh] hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 text-center">
                    <Button 
                        size="lg" 
                        onClick={() => router.back()}
                        className="rounded-full px-8 shadow-lg bg-pink-600 hover:bg-pink-700 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        Looks good, take me back
                    </Button>
                </div>
            </div>
        </div>
    );
}
