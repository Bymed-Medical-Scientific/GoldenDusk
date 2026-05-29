const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CATALOGUE_PAGE_SIZE = 12;
export const MAX_CATALOGUE_SEARCH_LENGTH = 200;

export type CatalogueQuery = {
  q: string | undefined;
  categoryId: string | undefined;
  pageNumber: number;
  pageSize: number;
};

export function parseCatalogueQuery(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogueQuery {
  const rawQ = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const q =
    rawQ.length === 0 ? undefined : rawQ.slice(0, MAX_CATALOGUE_SEARCH_LENGTH);
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
    pageSize: CATALOGUE_PAGE_SIZE,
  };
}

export function buildCatalogueHref(opts: {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (opts.q) sp.set("q", opts.q);
  if (opts.page != null && opts.page > 1) sp.set("page", String(opts.page));
  const qs = sp.toString();

  if (opts.categorySlug) {
    const base = `/catalogue/category/${encodeURIComponent(opts.categorySlug)}`;
    return qs ? `${base}?${qs}` : base;
  }

  if (opts.categoryId) sp.set("category", opts.categoryId);
  const legacyQs = sp.toString();
  return legacyQs ? `/catalogue?${legacyQs}` : "/catalogue";
}

export function categoryCataloguePath(slug: string): string {
  return `/catalogue/category/${encodeURIComponent(slug)}`;
}
