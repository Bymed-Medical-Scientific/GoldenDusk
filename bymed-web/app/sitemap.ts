import { listCategories } from "@/lib/api/categories";
import { listContentPages } from "@/lib/api/content";
import { listCatalogueItems } from "@/lib/api/catalogue-items";
import { listProducts } from "@/lib/api/products";
import { categoryCataloguePath } from "@/lib/catalogue/catalogue-params";
import { catalogueDetailPath } from "@/lib/catalogue/catalogue-path";
import { categoryProductsPath } from "@/lib/catalog/catalog-params";
import { productDetailPath } from "@/lib/catalog/product-path";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

const DEFAULT_BASE_URL = "http://localhost:3000";

/** CMS slugs rendered on dedicated routes (not /{slug}). */
const RESERVED_SLUGS = new Set(["home", "about", "services"]);

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
        url: withBase(baseUrl, productDetailPath(product)),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    );

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await listProducts({ pageNumber: page, pageSize });
      entries.push(
        ...nextPage.items.map((product) => ({
          url: withBase(baseUrl, productDetailPath(product)),
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

async function getCatalogueItemUrls(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const pageSize = 100;
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  try {
    const firstPage = await listCatalogueItems({ pageNumber: 1, pageSize });
    entries.push(
      ...firstPage.items.map((item) => ({
        url: withBase(baseUrl, catalogueDetailPath(item)),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    );

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await listCatalogueItems({ pageNumber: page, pageSize });
      entries.push(
        ...nextPage.items.map((item) => ({
          url: withBase(baseUrl, catalogueDetailPath(item)),
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

async function getCmsPageUrls(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  try {
    const result = await listContentPages({ pageNumber: 1, pageSize: 200 });
    return result.items
      .filter(
        (page) =>
          page.isPublished &&
          !RESERVED_SLUGS.has(page.slug) &&
          page.slug.trim().length > 0,
      )
      .map((page) => ({
        url: withBase(baseUrl, `/${page.slug}`),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
  } catch {
    return [];
  }
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
      url: withBase(baseUrl, "/catalogue"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
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
      priority: 0.85,
    },
    {
      url: withBase(baseUrl, "/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: withBase(baseUrl, "/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: withBase(baseUrl, "/case-studies"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: withBase(baseUrl, "/compliance"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: withBase(baseUrl, "/privacy-policy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: withBase(baseUrl, "/terms-of-service"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [productRoutes, catalogueRoutes, categoryRoutes, cmsRoutes] = await Promise.all([
    getProductUrls(baseUrl),
    getCatalogueItemUrls(baseUrl),
    (async () => {
      try {
        const categories = await listCategories();
        return categories.flatMap((category) => [
          {
            url: withBase(baseUrl, categoryProductsPath(category.slug)),
            lastModified: now,
            changeFrequency: "daily" as const,
            priority: 0.85,
          },
          {
            url: withBase(baseUrl, categoryCataloguePath(category.slug)),
            lastModified: now,
            changeFrequency: "daily" as const,
            priority: 0.85,
          },
        ]);
      } catch {
        return [];
      }
    })(),
    getCmsPageUrls(baseUrl),
  ]);

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...catalogueRoutes,
    ...cmsRoutes,
  ];
}
