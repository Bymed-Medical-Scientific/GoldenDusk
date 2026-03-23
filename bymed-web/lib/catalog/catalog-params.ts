const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CATALOG_PAGE_SIZE = 12;
export const MAX_CATALOG_SEARCH_LENGTH = 200;

export type CatalogQuery = {
  /** Trimmed search string for the API, or undefined when absent. */
  q: string | undefined;
  categoryId: string | undefined;
  pageNumber: number;
  pageSize: number;
};

export function parseCatalogQuery(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const rawQ = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const q =
    rawQ.length === 0
      ? undefined
      : rawQ.slice(0, MAX_CATALOG_SEARCH_LENGTH);

  const rawCat =
    typeof searchParams.category === "string"
      ? searchParams.category.trim()
      : "";
  const categoryId = UUID_RE.test(rawCat) ? rawCat : undefined;

  const rawPage =
    typeof searchParams.page === "string"
      ? Number.parseInt(searchParams.page, 10)
      : 1;
  const pageNumber =
    Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  return {
    q,
    categoryId,
    pageNumber,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

export function buildProductsHref(opts: {
  q?: string;
  categoryId?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (opts.q) sp.set("q", opts.q);
  if (opts.categoryId) sp.set("category", opts.categoryId);
  if (opts.page != null && opts.page > 1) sp.set("page", String(opts.page));
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}
