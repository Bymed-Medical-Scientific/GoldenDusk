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
          "/privacy-policy",
          "/terms-of-service",
        ],
        disallow: [
          "/account",
          "/account/",
          "/checkout",
          "/checkout/",
          "/cart",
          "/login",
          "/register",
          "/reset-password",
          "/verify-email",
          "/api/",
          "/search",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
