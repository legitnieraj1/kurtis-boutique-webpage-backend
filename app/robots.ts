import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // Main rule — allow everything except private/internal routes
            {
                userAgent: "*",
                allow: ["/", "/shop", "/product/", "/about-us", "/contact", "/exchange-and-shipping", "/privacy-policy", "/payment-security"],
                disallow: [
                    "/api/",
                    "/checkout",
                    "/cart",
                    "/account/",
                    "/admin/",
                    "/_next/",
                    "/login",
                    "/signup",
                    "/dashboard",
                    "/orders/",
                    "/wishlist",
                    "/auth/",
                ],
            },
            // Googlebot — crawl faster, same rules
            {
                userAgent: "Googlebot",
                allow: ["/", "/shop", "/product/", "/about-us", "/contact"],
                disallow: ["/api/", "/checkout", "/cart", "/account/", "/admin/", "/login", "/signup"],
            },
            // Googlebot-Image — allow product and shop images
            {
                userAgent: "Googlebot-Image",
                allow: ["/", "/product/", "/shop"],
            },
            // Bingbot — slightly slower crawl
            {
                userAgent: "Bingbot",
                allow: ["/"],
                disallow: ["/api/", "/checkout", "/cart", "/account/", "/admin/"],
                crawlDelay: 5,
            },
        ],
        sitemap: "https://kurtisboutique.in/sitemap.xml",
        host: "https://kurtisboutique.in",
    };
}
