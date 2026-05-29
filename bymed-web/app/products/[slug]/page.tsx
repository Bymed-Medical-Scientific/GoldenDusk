import { ProductDetail } from "@/components/products/product-detail";
import { ProductJsonLd } from "@/components/products/product-json-ld";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import type { ProductCardProduct } from "@/components/products/product-card";
import { buildProductGalleryImages } from "@/lib/catalog/product-gallery-images";
import { buildProductJsonLd } from "@/lib/catalog/product-json-ld";
import { productDetailPath } from "@/lib/catalog/product-path";
import { resolveProductRouteParam } from "@/lib/catalog/resolve-product";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html";
import { listProducts } from "@/lib/api/products";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-json-ld";
import { buildSocialMetadata } from "@/lib/seo/social-metadata";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type ProductDetailPageProps = {
  params: { slug: string };
};

export const revalidate = 3600;

function productMetaDescription(html: string, categoryName: string): string {
  const plainDescription = plainTextFromHtml(html);
  const base =
    plainDescription.length > 0
      ? plainDescription
      : `${categoryName} supplied in Zimbabwe by ByMed Medical & Scientific. Request a quote, specifications, installation, and training.`;
  return base.length > 160 ? `${base.slice(0, 157)}…` : base;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const resolved = await resolveProductRouteParam(params.slug);
  if (!resolved) {
    return { title: "Product | ByMed Medical & Scientific" };
  }

  const { product } = resolved;
  const description = productMetaDescription(
    product.description,
    product.categoryName,
  );
  const gallery = buildProductGalleryImages(product);
  const ogImage = gallery[0]?.url;
  const path = productDetailPath(product);
  const title = `${product.name} | ${product.categoryName} — Zimbabwe | ByMed`;
  const categoryKeyword = product.categoryName
    ? `${product.categoryName} equipment Zimbabwe`
    : undefined;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.categoryName,
      categoryKeyword,
      "medical equipment Zimbabwe",
      "laboratory equipment Zimbabwe",
      "ByMed",
    ].filter((k): k is string => Boolean(k?.trim())),
    ...buildSocialMetadata({
      title: product.name,
      description,
      image: ogImage,
      canonicalPath: path,
    }),
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
  inventoryCount: number;
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
    inventoryCount: p.inventoryCount,
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
  const inStock = product.isAvailable && product.inventoryCount > 0;

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
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: product.name, path: productDetailPath(product) },
  ]);

  return (
    <>
      <ProductJsonLd data={jsonLd} />
      {breadcrumbJsonLd ? <JsonLdScript data={breadcrumbJsonLd} /> : null}
      <ProductDetail
        product={product}
        galleryImages={galleryImages}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
