import { listProducts } from "@/lib/api/products";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

const DEFAULT_BASE_URL = "http://localhost:3000";

function withBase(baseUrl: string, path: string): string {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getProductUrls(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const pageSize = 100;
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  try {
    const firstPage = await listProducts({ pageNumber: 1, pageSize });
    entries.push(
      ...firstPage.items.map((product) => ({
        url: withBase(baseUrl, `/products/${product.id}`),
          lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    );

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await listProducts({ pageNumber: page, pageSize });
      entries.push(
        ...nextPage.items.map((product) => ({
          url: withBase(baseUrl, `/products/${product.id}`),
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.7,
        })),
      );
    }
  } catch {
    return [];
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl() ?? DEFAULT_BASE_URL;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: withBase(baseUrl, "/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: withBase(baseUrl, "/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: withBase(baseUrl, "/services"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: withBase(baseUrl, "/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: withBase(baseUrl, "/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const productRoutes = await getProductUrls(baseUrl);
  return [...staticRoutes, ...productRoutes];
}
