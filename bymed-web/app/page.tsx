import type { HomeFeaturedProduct } from "@/components/marketing/home-marketing-premium";
import { HomeMarketingView } from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_HOME_MARKETING,
  parseHomeMarketingContent,
} from "@/lib/content/marketing-pages";
import { listProducts } from "@/lib/api/products";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const revalidate = 3600;

const HOME_SLUG = "home";

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
    const catalog = await listProducts({ pageNumber: 1, pageSize: 4 });
    featuredProducts = catalog.items.map((p) => {
      const ordered =
        p.images?.slice().sort((a, b) => a.displayOrder - b.displayOrder) ?? [];
      const first = ordered[0];
      const imageUrl = resolveProductImageUrl(
        p.primaryImageUrl ?? first?.url ?? null,
      );
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
    });
  } catch {
    /* catalog API unavailable — featured section uses placeholders */
  }

  return (
    <HomeMarketingView data={data} featuredProducts={featuredProducts} />
  );
}
