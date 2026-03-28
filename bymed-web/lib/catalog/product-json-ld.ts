import { plainTextFromHtml } from "@/lib/html/plain-text-from-html";
import type { ProductDto } from "@/types/product";

type ProductJsonLdInput = {
  product: ProductDto;
  /** Absolute product page URL (storefront). */
  productPageUrl?: string;
  /** Absolute image URLs for schema.org `image`. */
  imageUrls: string[];
  inStock: boolean;
};

/**
 * JSON-LD `Product` + `Offer` for rich results (Requirement 10.5).
 */
export function buildProductJsonLd({
  product,
  productPageUrl,
  imageUrls,
  inStock,
}: ProductJsonLdInput): Record<string, unknown> {
  const availability = inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price: product.price.toFixed(2),
    priceCurrency: product.currency.trim().toUpperCase(),
    availability,
    itemCondition: "https://schema.org/NewCondition",
  };

  if (productPageUrl) {
    offer.url = productPageUrl;
  }

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: plainTextFromHtml(product.description),
    offers: offer,
  };

  if (product.sku?.trim()) {
    node.sku = product.sku.trim();
  }

  if (imageUrls.length === 1) {
    node.image = imageUrls[0];
  } else if (imageUrls.length > 1) {
    node.image = imageUrls;
  }

  if (productPageUrl) {
    node.url = productPageUrl;
  }

  return node;
}
