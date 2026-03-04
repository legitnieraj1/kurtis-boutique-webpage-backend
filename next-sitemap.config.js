/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://kurtisboutique.in",
  generateRobotsTxt: false, // We already have a custom robots.txt
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    "/api/*",
    "/checkout/*",
    "/cart",
    "/account/*",
    "/admin/*",
    "/login",
    "/signup",
    "/dashboard",
    "/orders/*",
    "/wishlist",
    "/auth/*",
  ],
  transform: async (config, path) => {
    let priority = 0.7;
    let changefreq = "weekly";

    if (path === "/") {
      priority = 1.0;
      changefreq = "daily";
    } else if (path === "/shop") {
      priority = 0.95;
      changefreq = "daily";
    } else if (path.startsWith("/product/")) {
      priority = 0.85;
    } else if (["/about-us", "/contact"].includes(path)) {
      priority = 0.6;
      changefreq = "monthly";
    } else if (
      ["/privacy-policy", "/exchange-and-shipping", "/payment-security"].includes(path)
    ) {
      priority = 0.4;
      changefreq = "monthly";
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
