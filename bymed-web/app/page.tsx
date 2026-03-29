import type { HomeFeaturedProduct } from "@/components/marketing/home-marketing-premium";
import { HomeMarketingView } from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_HOME_MARKETING,
  parseHomeMarketingContent,
} from "@/lib/content/marketing-pages";
import { getProductById, listProducts } from "@/lib/api/products";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const revalidate = 3600;

const HOME_SLUG = "home";
const FEATURED_PRODUCTS_LIMIT = 4;

function toFeaturedProduct(p: {
  id: string;
  name: string;
  categoryName: string;
  primaryImageUrl?: string | null;
  images?: { url: string; altText: string; displayOrder: number }[] | null;
}): HomeFeaturedProduct {
  const ordered =
    p.images?.slice().sort((a, b) => a.displayOrder - b.displayOrder) ?? [];
  const first = ordered[0];
  const imageUrl = resolveProductImageUrl(p.primaryImageUrl ?? first?.url ?? null);
  const imageAlt =
    ordered.find((i) => i.url === p.primaryImageUrl)?.altText ??
    first?.altText ??
    p.name;
  return {
    id: p.id,
    name: p.name,
    categoryName: p.categoryName,
    imageUrl,
    imageAlt,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage(HOME_SLUG);
  const parsed = page
    ? parseHomeMarketingContent(page.content, DEFAULT_HOME_MARKETING)
    : DEFAULT_HOME_MARKETING;
  const title = page?.metadata.metaTitle?.trim() || parsed.metaTitle;
  const description =
    page?.metadata.metaDescription?.trim() || parsed.metaDescription;
  const canonical = absoluteUrl("/");
  const ogTitle =
    page?.metadata.metaTitle?.trim() || parsed.ogTitle;
  const ogImage = page?.metadata.ogImage?.trim() || undefined;

  return {
    title,
    description,
    keywords: parsed.keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description,
    },
  };
}

export default async function Home() {
  const page = await loadMarketingPage(HOME_SLUG);
  const data = page
    ? parseHomeMarketingContent(page.content, DEFAULT_HOME_MARKETING)
    : DEFAULT_HOME_MARKETING;

  let featuredProducts: HomeFeaturedProduct[] = [];
  try {
    const requestedIds = data.featuredProductIds.slice(0, FEATURED_PRODUCTS_LIMIT);
    const selectedById = new Map<string, HomeFeaturedProduct>();

    if (requestedIds.length > 0) {
      const fetched = await Promise.all(
        requestedIds.map(async (id) => {
          try {
            return await getProductById(id);
          } catch {
            return null;
          }
        }),
      );
      for (const p of fetched) {
        if (!p) continue;
        selectedById.set(p.id, toFeaturedProduct(p));
      }
      featuredProducts = requestedIds
        .map((id) => selectedById.get(id))
        .filter((p): p is HomeFeaturedProduct => Boolean(p));
    }

    if (featuredProducts.length < FEATURED_PRODUCTS_LIMIT) {
      const catalog = await listProducts({
        pageNumber: 1,
        pageSize: FEATURED_PRODUCTS_LIMIT * 3,
      });
      for (const p of catalog.items) {
        if (featuredProducts.length >= FEATURED_PRODUCTS_LIMIT) break;
        if (selectedById.has(p.id)) continue;
        featuredProducts.push(toFeaturedProduct(p));
      }
    }
  } catch {
    /* catalog API unavailable — featured section uses placeholders */
  }

  return (
    <HomeMarketingView data={data} featuredProducts={featuredProducts} />
  );
}
