import type { Metadata } from "next";

/**
 * Faceted catalog URLs (?q=, ?page=, filters) create duplicate thin pages — keep them out of the index.
 */
export function catalogListingRobots(
  searchParams: Record<string, string | string[] | undefined>,
): Metadata["robots"] | undefined {
  const hasQuery =
    typeof searchParams.q === "string" && searchParams.q.trim().length > 0;
  const hasBrand =
    typeof searchParams.brand === "string" && searchParams.brand.trim().length > 0;
  const hasClientType =
    typeof searchParams.clientType === "string" &&
    searchParams.clientType.trim().length > 0;
  const rawPage =
    typeof searchParams.page === "string"
      ? Number.parseInt(searchParams.page, 10)
      : 1;
  const hasPagination = Number.isFinite(rawPage) && rawPage > 1;
  const hasPriceFilter =
    typeof searchParams.minPrice === "string" ||
    typeof searchParams.maxPrice === "string";

  if (hasQuery || hasBrand || hasClientType || hasPagination || hasPriceFilter) {
    return { index: false, follow: true };
  }

  return undefined;
}
