import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import type { ProductDto } from "@/types/product";

export type GalleryImage = {
  url: string;
  alt: string;
};

/**
 * Ordered gallery slides: `images` by `displayOrder`, then primary if nothing else.
 */
export function buildProductGalleryImages(product: ProductDto): GalleryImage[] {
  const out: GalleryImage[] = [];
  const seen = new Set<string>();

  const push = (rawUrl: string | null | undefined, alt: string) => {
    const url = resolveProductImageUrl(rawUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ url, alt: alt.trim() || product.name });
  };

  if (product.images?.length) {
    const sorted = [...product.images].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    for (const img of sorted) {
      push(img.url, img.altText || product.name);
    }
  }

  if (out.length === 0) {
    push(product.primaryImageUrl, product.name);
  }

  return out;
}
