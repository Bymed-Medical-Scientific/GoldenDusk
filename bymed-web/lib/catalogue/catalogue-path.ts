const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function catalogueDetailPath(item: { id: string; slug?: string | null }): string {
  const slug = item.slug?.trim();
  if (slug) return `/catalogue/${encodeURIComponent(slug)}`;
  return `/catalogue/${item.id}`;
}

export function isUuidCatalogueParam(value: string): boolean {
  return UUID_RE.test(value.trim());
}
