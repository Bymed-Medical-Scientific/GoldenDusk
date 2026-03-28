import { AboutMarketingView } from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_ABOUT_MARKETING,
  parseAboutMarketingContent,
} from "@/lib/content/marketing-pages";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const revalidate = 3600;

const ABOUT_SLUG = "about";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage(ABOUT_SLUG);
  const parsed = page
    ? parseAboutMarketingContent(page.content, DEFAULT_ABOUT_MARKETING)
    : DEFAULT_ABOUT_MARKETING;
  const title = page?.metadata.metaTitle?.trim() || parsed.metaTitle;
  const description =
    page?.metadata.metaDescription?.trim() || parsed.metaDescription;
  const canonical = absoluteUrl("/about");
  const ogTitle = page?.metadata.metaTitle?.trim() || parsed.ogTitle;
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
      title: page?.metadata.metaTitle?.trim() || parsed.twitterTitle,
      description,
    },
  };
}

export default async function AboutPage() {
  const page = await loadMarketingPage(ABOUT_SLUG);
  const data = page
    ? parseAboutMarketingContent(page.content, DEFAULT_ABOUT_MARKETING)
    : DEFAULT_ABOUT_MARKETING;
  return <AboutMarketingView data={data} />;
}
