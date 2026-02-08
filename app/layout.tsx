import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kurtis Boutique | Elegant Indian Fashion",
  description: "Premium Indian women's boutique offering Kurtis, Co-ords, and Festive wear.",
};

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased text-foreground relative min-h-screen`}
      >
        <div className="fixed inset-0 -z-10 bg-background pointer-events-none">
          <BackgroundGradientAnimation
            containerClassName="h-full w-full pointer-events-none"
            className="absolute inset-0"
            interactive={true}
            firstColor="128, 24, 72"
            secondColor="176, 84, 128"
            thirdColor="212, 140, 168"
            fourthColor="180, 120, 150"
            fifthColor="150, 60, 100"
            pointerColor="176, 84, 128"
            size="80%"
          />
        </div>
        <AuthProvider>
          <div className="relative z-0">
            {children}
          </div>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            className:
              "bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-xl p-4 flex gap-3 text-sm font-medium text-foreground ring-1 ring-black/5 !w-[350px]",
            classNames: {
              success: "text-green-700 bg-green-50/50 border-green-200/50",
              error: "text-red-700 bg-red-50/50 border-red-200/50",
              info: "text-blue-700 bg-blue-50/50 border-blue-200/50",
              warning: "text-yellow-700 bg-yellow-50/50 border-yellow-200/50",
              toast: "group-[.toaster]:bg-white/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-white/40 group-[.toaster]:shadow-xl",
              title: "group-[.toast]:font-serif group-[.toast]:text-base",
              description: "group-[.toast]:text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}

