import { getProductById, getProductBySlug } from "@/lib/api/products";
import { isProductUuidParam } from "@/lib/catalog/product-path";
import { ApiError } from "@/lib/api/http";
import type { ProductDto } from "@/types/product";

export type ResolvedProduct = {
  product: ProductDto;
  /** When the request used a legacy UUID URL, the canonical slug path to redirect to. */
  redirectToSlugPath?: string;
};

export async function resolveProductRouteParam(
  param: string,
): Promise<ResolvedProduct | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;

  if (isProductUuidParam(trimmed)) {
    try {
      const product = await getProductById(trimmed);
      const slug = product.slug?.trim();
      return {
        product,
        redirectToSlugPath:
          slug && slug !== trimmed
            ? `/products/${encodeURIComponent(slug)}`
            : undefined,
      };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  try {
    const product = await getProductBySlug(trimmed);
    return { product };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
