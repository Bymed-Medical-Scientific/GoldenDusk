import { catalogueDetailPath } from "@/lib/catalogue/catalogue-path";
import { absoluteUrl } from "@/lib/site-url";
import type { CatalogueItemDto } from "@/types/catalogue-item";

export function buildCatalogueItemJsonLd(
  item: CatalogueItemDto,
  imageUrl?: string | null,
): Record<string, unknown> {
  const url = absoluteUrl(catalogueDetailPath(item));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description,
    image: imageUrl ? [imageUrl] : undefined,
    brand: item.brandName
      ? { "@type": "Brand", name: item.brandName }
      : undefined,
    category: item.categoryName,
    url,
  };
}
