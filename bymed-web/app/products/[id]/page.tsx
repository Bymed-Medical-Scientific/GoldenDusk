import { ProductDetail } from "@/components/products/product-detail";
import { ProductJsonLd } from "@/components/products/product-json-ld";
import type { ProductCardProduct } from "@/components/products/product-card";
import { buildProductGalleryImages } from "@/lib/catalog/product-gallery-images";
import { buildProductJsonLd } from "@/lib/catalog/product-json-ld";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { getProductById, listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductDetailPageProps = {
  params: { id: string };
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  if (!UUID_RE.test(params.id)) {
    return { title: "Product | Bymed Medical & Scientific" };
  }
  try {
    const product = await getProductById(params.id);
    const description =
      product.description.length > 160
        ? `${product.description.slice(0, 157)}…`
        : product.description;
    const gallery = buildProductGalleryImages(product);
    const ogImage = gallery[0]?.url;

    const canonical = absoluteUrl(`/products/${product.id}`);

    return {
      title: `${product.name} | Bymed Medical & Scientific`,
      description,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: product.name,
        description,
        type: "website",
        url: canonical,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    };
  } catch {
    return { title: "Product | Bymed Medical & Scientific" };
  }
}

function toCardProduct(p: {
  id: string;
  name: string;
  primaryImageUrl?: string | null;
  price: number;
  currency: string;
  isAvailable: boolean;
  inventoryCount: number;
  categoryName: string;
}): ProductCardProduct {
  return {
    id: p.id,
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
  if (!UUID_RE.test(params.id)) notFound();

  let product;
  try {
    product = await getProductById(params.id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

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

  const productPageUrl = absoluteUrl(`/products/${product.id}`);
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
