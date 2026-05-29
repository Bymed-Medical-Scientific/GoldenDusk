import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

const DEFAULT_BASE_URL = "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl() ?? DEFAULT_BASE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/",
          "/about",
          "/services",
          "/contact",
          "/case-studies",
          "/compliance",
        ],
        disallow: [
          "/account",
          "/account/",
          "/checkout",
          "/checkout/",
          "/quote",
          "/quote/",
          "/quote-cart",
          "/quote-cart/",
          "/cart",
          "/login",
          "/register",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
