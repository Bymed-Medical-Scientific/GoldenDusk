import { HomeMarketingView } from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_HOME_MARKETING,
  parseHomeMarketingContent,
} from "@/lib/content/marketing-pages";
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
  return <HomeMarketingView data={data} />;
}
