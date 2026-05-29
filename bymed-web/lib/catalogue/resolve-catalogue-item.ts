import { getCatalogueItemById, getCatalogueItemBySlug } from "@/lib/api/catalogue-items";
import { ApiError } from "@/lib/api/http";
import type { CatalogueItemDto } from "@/types/catalogue-item";
import { isUuidCatalogueParam } from "./catalogue-path";

export type ResolvedCatalogueRoute = {
  item: CatalogueItemDto;
  canonicalSlug: string;
  shouldRedirectFromUuid: boolean;
};

export async function resolveCatalogueRouteParam(
  param: string,
): Promise<ResolvedCatalogueRoute | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;

  try {
    if (isUuidCatalogueParam(trimmed)) {
      const item = await getCatalogueItemById(trimmed);
      return {
        item,
        canonicalSlug: item.slug,
        shouldRedirectFromUuid: Boolean(item.slug && item.slug !== trimmed),
      };
    }

    const item = await getCatalogueItemBySlug(trimmed);
    return {
      item,
      canonicalSlug: item.slug,
      shouldRedirectFromUuid: false,
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
