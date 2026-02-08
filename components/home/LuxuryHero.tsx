"use client";

import { cn } from "@/lib/utils";

export function LuxuryHero() {
    return (
        <section className="relative w-full h-[60vh] md:h-[70vh] bg-white flex flex-col items-center justify-center overflow-hidden">
            <div className="relative overflow-hidden select-none pointer-events-none">
                {/* Logo Image */}
                <img
                    src="/kurtis-logo-large.png"
                    alt="Kurtis Boutique"
                    className="relative z-10 w-[115px] md:w-[150px] h-auto object-contain block"
                />

                {/* Shine Overlay */}
                <div
                    className="absolute inset-0 z-20 w-full h-full pointer-events-none"
                    style={{
                        background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)',
                        transform: 'translateX(-100%) skewX(-20deg)',
                        opacity: 0,
                        animation: 'shine-sweep 1.5s cubic-bezier(0.4, 0.0, 0.2, 1) 0.3s forwards',
                        mixBlendMode: 'overlay', // or 'soft-light' for better effect on dark logo
                        filter: 'blur(20px)', // "Blur on sweep: high"
                    }}
                />

                <style jsx>{`
          @keyframes shine-sweep {
            0% {
              transform: translateX(-100%) translateY(-100%) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.08; /* User requested: Opacity of light layer max 6-8% */
            }
            90% {
              opacity: 0.08;
            }
            100% {
              transform: translateX(100%) translateY(100%) rotate(0deg);
              opacity: 0;
            }
          }
        `}</style>
            </div>
        </section>
    );
}
