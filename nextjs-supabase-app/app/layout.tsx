import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Project Manager | Supabase + Next.js",
    description: "A production-ready full-stack application with Supabase and Next.js 14",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-900">
                {children}
            </body>
        </html>
    );
}
