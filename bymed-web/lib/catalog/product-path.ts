import type { ProductDto } from "@/types/product";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Canonical storefront path for a product (prefer slug for SEO). */
export function productDetailPath(product: Pick<ProductDto, "id" | "slug">): string {
  const slug = product.slug?.trim();
  if (slug) return `/products/${encodeURIComponent(slug)}`;
  return `/products/${product.id}`;
}

export function isProductUuidParam(param: string): boolean {
  return UUID_RE.test(param);
}
