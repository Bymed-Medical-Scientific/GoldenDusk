import { absoluteUrl } from "@/lib/site-url";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

/** BreadcrumbList JSON-LD for product and catalog pages (rich results). */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> | null {
  const elements = items
    .map((item, index) => {
      const itemUrl = absoluteUrl(item.path);
      if (!itemUrl) return null;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: itemUrl,
      };
    })
    .filter((el): el is NonNullable<typeof el> => el !== null);

  if (elements.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements,
  };
}
