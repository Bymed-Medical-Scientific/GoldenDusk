import { SITE_LOCALE, SITE_NAME } from "@/lib/seo/site-seo";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const DEFAULT_OG_IMAGE_PATH = "/images/bymed-logo.webp";

export function defaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH) ?? DEFAULT_OG_IMAGE_PATH;
}

type SocialMetadataInput = {
  title: string;
  description: string;
  /** Path or absolute URL for Open Graph / Twitter image. */
  image?: string;
  canonicalPath?: string;
  /** When true, product/article-style OG type. */
  ogType?: "website" | "article";
};

/** Consistent Open Graph + Twitter tags across marketing and catalog pages. */
export function buildSocialMetadata({
  title,
  description,
  image,
  canonicalPath,
  ogType = "website",
}: SocialMetadataInput): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  const canonical = canonicalPath ? absoluteUrl(canonicalPath) : undefined;
  const ogImage = image?.trim() || defaultOgImageUrl();
  const images = ogImage ? [{ url: ogImage, alt: SITE_NAME }] : undefined;

  return {
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: ogType,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url: canonical,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
