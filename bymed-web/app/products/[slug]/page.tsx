import { ProductDetail } from "@/components/products/product-detail";
import { ProductJsonLd } from "@/components/products/product-json-ld";
import type { ProductCardProduct } from "@/components/products/product-card";
import { buildProductGalleryImages } from "@/lib/catalog/product-gallery-images";
import { buildProductJsonLd } from "@/lib/catalog/product-json-ld";
import { productDetailPath } from "@/lib/catalog/product-path";
import { resolveProductRouteParam } from "@/lib/catalog/resolve-product";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html";
import { listProducts } from "@/lib/api/products";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type ProductDetailPageProps = {
  params: { slug: string };
};

function productMetaDescription(html: string): string {
  const plainDescription = plainTextFromHtml(html);
  return plainDescription.length > 160
    ? `${plainDescription.slice(0, 157)}…`
    : plainDescription;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const resolved = await resolveProductRouteParam(params.slug);
  if (!resolved) {
    return { title: "Product | Bymed Medical & Scientific" };
  }

  const { product } = resolved;
  const description = productMetaDescription(product.description);
  const gallery = buildProductGalleryImages(product);
  const ogImage = gallery[0]?.url;
  const canonical = absoluteUrl(productDetailPath(product));
  const title = `${product.name} | Bymed Medical & Scientific`;
  const categoryKeyword = product.categoryName
    ? `${product.categoryName} Zimbabwe`
    : undefined;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.categoryName,
      categoryKeyword,
      "ByMed",
      "medical equipment Zimbabwe",
    ].filter((k): k is string => Boolean(k?.trim())),
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: product.name,
      description,
    },
  };
}

function toCardProduct(p: {
  id: string;
  name: string;
  slug: string;
  primaryImageUrl?: string | null;
  price: number;
  currency: string;
  isAvailable: boolean;
  categoryName: string;
}): ProductCardProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: resolveProductImageUrl(p.primaryImageUrl),
    imageAlt: p.name,
    price: p.price,
    currency: p.currency,
    isAvailable: p.isAvailable,
    categoryName: p.categoryName,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolved = await resolveProductRouteParam(params.slug);
  if (!resolved) notFound();

  if (resolved.redirectToSlugPath) {
    permanentRedirect(resolved.redirectToSlugPath);
  }

  const { product } = resolved;
  const galleryImages = buildProductGalleryImages(product);
  const inStock = product.isAvailable;

  let relatedProducts: ProductCardProduct[] = [];
  try {
    const relatedResult = await listProducts({
      categoryId: product.categoryId,
      pageNumber: 1,
      pageSize: 12,
    });
    relatedProducts = relatedResult.items
      .filter((p) => p.id !== product.id)
      .slice(0, 4)
      .map(toCardProduct);
  } catch {
    relatedProducts = [];
  }

  const productPageUrl = absoluteUrl(productDetailPath(product));
  const jsonLd = buildProductJsonLd({
    product,
    productPageUrl,
    imageUrls: galleryImages.map((g) => g.url),
    inStock,
  });

  return (
    <>
      <ProductJsonLd data={jsonLd} />
      <ProductDetail
        product={product}
        galleryImages={galleryImages}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
