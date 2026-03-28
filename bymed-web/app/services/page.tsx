import { ServicesMarketingView } from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_SERVICES_MARKETING,
  parseServicesMarketingContent,
} from "@/lib/content/marketing-pages";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const revalidate = 3600;

const SERVICES_SLUG = "services";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage(SERVICES_SLUG);
  const parsed = page
    ? parseServicesMarketingContent(page.content, DEFAULT_SERVICES_MARKETING)
    : DEFAULT_SERVICES_MARKETING;
  const title = page?.metadata.metaTitle?.trim() || parsed.metaTitle;
  const description =
    page?.metadata.metaDescription?.trim() || parsed.metaDescription;
  const canonical = absoluteUrl("/services");
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

export default async function ServicesPage() {
  const page = await loadMarketingPage(SERVICES_SLUG);
  const data = page
    ? parseServicesMarketingContent(page.content, DEFAULT_SERVICES_MARKETING)
    : DEFAULT_SERVICES_MARKETING;
  return <ServicesMarketingView data={data} />;
}
