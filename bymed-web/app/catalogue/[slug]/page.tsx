import { CatalogueDetail } from "@/components/catalogue/catalogue-detail";
import { CatalogueJsonLd } from "@/components/catalogue/catalogue-json-ld";
import type { CatalogueCardItem } from "@/components/catalogue/catalogue-card";
import { buildCatalogueGalleryImages } from "@/lib/catalogue/catalogue-gallery-images";
import { buildCatalogueItemJsonLd } from "@/lib/catalogue/catalogue-item-json-ld";
import { catalogueDetailPath } from "@/lib/catalogue/catalogue-path";
import { resolveCatalogueRouteParam } from "@/lib/catalogue/resolve-catalogue-item";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html";
import { listCatalogueItems } from "@/lib/api/catalogue-items";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type CatalogueDetailPageProps = {
  params: { slug: string };
};

function metaDescription(html: string): string {
  const plain = plainTextFromHtml(html);
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
}

export async function generateMetadata({
  params,
}: CatalogueDetailPageProps): Promise<Metadata> {
  const resolved = await resolveCatalogueRouteParam(params.slug);
  if (!resolved) {
    return { title: "Catalogue | Bymed Medical & Scientific" };
  }

  const { item } = resolved;
  const description = metaDescription(item.description);
  const gallery = buildCatalogueGalleryImages(item);
  const ogImage = gallery[0]?.url;
  const canonical = absoluteUrl(catalogueDetailPath(item));
  const title = `${item.name} | Catalogue | Bymed Medical & Scientific`;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: item.name,
      description,
      type: "website",
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: item.name,
      description,
    },
  };
}

export default async function CatalogueDetailPage({ params }: CatalogueDetailPageProps) {
  const resolved = await resolveCatalogueRouteParam(params.slug);
  if (!resolved) notFound();

  if (resolved.shouldRedirectFromUuid) {
    permanentRedirect(catalogueDetailPath(resolved.item));
  }

  const { item } = resolved;
  const galleryImages = buildCatalogueGalleryImages(item);

  let relatedItems: CatalogueCardItem[] = [];
  try {
    const related = await listCatalogueItems({
      categoryId: item.categoryId,
      pageNumber: 1,
      pageSize: 12,
    });
    relatedItems = related.items
      .filter((c) => c.id !== item.id)
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        imageUrl: resolveProductImageUrl(c.primaryImageUrl),
        imageAlt: c.name,
        categoryName: c.categoryName,
        brandName: c.brandName ?? undefined,
        brandLogoUrl: resolveProductImageUrl(c.brandLogoUrl) ?? undefined,
        brandWebsiteUrl: c.brandWebsiteUrl ?? undefined,
      }));
  } catch {
    relatedItems = [];
  }

  const jsonLd = buildCatalogueItemJsonLd(item, galleryImages[0]?.url);

  return (
    <>
      <CatalogueJsonLd data={jsonLd} />
      <CatalogueDetail
        item={item}
        galleryImages={galleryImages}
        relatedItems={relatedItems}
      />
    </>
  );
}
