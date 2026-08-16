import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import type { CatalogueItemDto } from "@/types/catalogue-item";

export type GalleryImage = {
  url: string;
  alt: string;
};

export function buildCatalogueGalleryImages(item: CatalogueItemDto): GalleryImage[] {
  const out: GalleryImage[] = [];
  const seen = new Set<string>();

  const push = (rawUrl: string | null | undefined, alt: string) => {
    const url = resolveProductImageUrl(rawUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ url, alt: alt.trim() || item.name });
  };

  if (item.images?.length) {
    const sorted = [...item.images].sort((a, b) => a.displayOrder - b.displayOrder);
    for (const img of sorted) {
      push(img.url, img.altText || item.name);
    }
  }

  if (out.length === 0) {
    push(item.primaryImageUrl, item.name);
  }

  return out;
}
