import { getPageBySlug } from "@/lib/api/content";
import { ApiError } from "@/lib/api/http";
import type { PageContentDto } from "@/types/page-content";
import { cache } from "react";

async function fetchPublishedMarketingPage(
  slug: string,
): Promise<PageContentDto | null> {
  try {
    const page = await getPageBySlug(slug);
    if (!page.isPublished) return null;
    return page;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    return null;
  }
}

/** Per-request cache; use the same slug from `generateMetadata` and the page body. */
export const loadMarketingPage = cache((slug: string) =>
  fetchPublishedMarketingPage(slug),
);
