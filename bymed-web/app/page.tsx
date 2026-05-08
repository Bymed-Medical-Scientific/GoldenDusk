import type { HomeFeaturedProduct } from "@/components/marketing/home-marketing-premium";
import { HomeMarketingView } from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_HOME_MARKETING,
  parseHomeMarketingContent,
  resolvedHeroSlides,
} from "@/lib/content/marketing-pages";
import { getProductById, listProducts } from "@/lib/api/products";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import ReactDOM from "react-dom";

export const revalidate = 3600;

const HOME_SLUG = "home";
const FEATURED_PRODUCTS_LIMIT = 4;

/**
 * Mirrors the deviceSizes ceiling configured in next.config.mjs. Browsers pick
 * the best match based on the imageSizes hint, so we emit one URL per width.
 */
const HERO_PRELOAD_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2560];

/**
 * Quality used for hero slide 0. Must match the value passed to <Image> in
 * home-hero-carousel.tsx — otherwise the preload URL won't match the actual
 * fetch URL and the browser will download the asset twice.
 */
const HERO_PRELOAD_QUALITY = 85;

/**
 * Build the same `_next/image` URL Next.js Image emits for the hero, so the
 * preload `<link>` we render below dedupes with the one Image auto-emits. The
 * benefit of also emitting it from this top-of-tree Server Component is that
 * the preload tag is flushed into the head during the very first chunk of
 * the SSR stream, before the (client-component) carousel subtree resolves.
 */
function buildNextImageUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${HERO_PRELOAD_QUALITY}`;
}

function preloadHeroSlide(src: string): void {
  const widths = HERO_PRELOAD_WIDTHS;
  const largest = widths[widths.length - 1];
  const imageSrcSet = widths
    .map((w) => `${buildNextImageUrl(src, w)} ${w}w`)
    .join(", ");
  ReactDOM.preload(buildNextImageUrl(src, largest), {
    as: "image",
    fetchPriority: "high",
    imageSrcSet,
    imageSizes: "100vw",
  });
}

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

  // Emit the slide-0 preload from the top of the tree so it lands in the head
  // during the first SSR flush — earlier than the (client) carousel's own
  // Image-emitted preload. Browsers dedupe by URL so we don't pay twice.
  const heroSlide0Src = resolvedHeroSlides(data)[0]?.imageSrc;
  if (heroSlide0Src) {
    preloadHeroSlide(heroSlide0Src);
  }

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
