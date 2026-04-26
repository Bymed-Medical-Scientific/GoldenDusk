import { ProductDescription } from "@/components/products/product-description";
import type { ProductCardProduct } from "@/components/products/product-card";
import { FormattedPrice } from "@/components/price/formatted-price";
import type { GalleryImage } from "@/lib/catalog/product-gallery-images";
import type { ProductDto } from "@/types/product";
import dynamic from "next/dynamic";
import Link from "next/link";

const AddToCartButton = dynamic(
  () =>
    import("@/components/products/add-to-cart-button").then(
      (mod) => mod.AddToCartButton,
    ),
  {
    loading: () => (
      <div className="h-11 w-full max-w-xs animate-pulse rounded-lg bg-muted" />
    ),
  },
);

const ProductImageGallery = dynamic(
  () =>
    import("@/components/products/product-image-gallery").then(
      (mod) => mod.ProductImageGallery,
    ),
  {
    loading: () => (
      <div className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
    ),
  },
);

const ProductGrid = dynamic(
  () =>
    import("@/components/products/product-grid").then((mod) => mod.ProductGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
      </div>
    ),
  },
);

type ProductDetailProps = {
  product: ProductDto;
  galleryImages: GalleryImage[];
  relatedProducts: ProductCardProduct[];
};

export function ProductDetail({
  product,
  galleryImages,
  relatedProducts,
}: ProductDetailProps) {
  const inStock = product.isAvailable && product.inventoryCount > 0;
  const lowStock =
    inStock && product.inventoryCount <= product.lowStockThreshold;
  const specEntries = product.specifications
    ? Object.entries(product.specifications).filter(
        ([k, v]) => k.trim() && String(v).trim(),
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <nav className="mb-6 min-w-0 max-w-full overflow-x-hidden text-muted-foreground sm:mb-8" aria-label="Breadcrumb">
        <ol className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          <li>
            <Link
              href="/products"
              className="font-medium text-brand hover:underline"
            >
              Products
            </Link>
          </li>
          <li aria-hidden className="text-muted-foreground">
            /
          </li>
          <li className="min-w-0 flex-1 break-words text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
        <ProductImageGallery
          images={galleryImages}
          productName={product.name}
        />

        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {product.categoryName}
          </p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          {product.sku?.trim() ? (
            <p className="mt-2 text-sm text-muted-foreground">
              SKU:{" "}
              <span className="break-all font-mono text-foreground">{product.sku.trim()}</span>
            </p>
          ) : null}

          {product.price > 0 ? (
            <p className="mt-4 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
              <FormattedPrice amount={product.price} currency={product.currency} />
            </p>
          ) : (
            <p className="mt-4 text-base font-medium text-muted-foreground sm:text-lg">
              Login with an approved account to view pricing.
            </p>
          )}

          <div className="mt-3 text-sm">
            {inStock ? (
              <p>
                <span className="font-medium text-foreground">In stock</span>
                {lowStock ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — only {product.inventoryCount} left
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="font-medium text-foreground">Out of stock</p>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              productPrice={product.price}
              productCurrency={product.currency}
              productImageUrl={product.primaryImageUrl}
              disabled={!inStock}
              maxQuantity={product.inventoryCount}
            />
          </div>

          {specEntries.length > 0 ? (
            <div className="mt-8 sm:mt-10">
              <h2 className="text-lg font-semibold text-foreground">
                Specifications
              </h2>
              <dl className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
                {specEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="break-words text-sm font-medium text-muted-foreground">
                      {key}
                    </dt>
                    <dd className="break-words text-sm text-foreground sm:col-span-2">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-10 max-w-full overflow-x-hidden border-t border-border pt-6 sm:mt-12 sm:pt-8" aria-labelledby="description-heading">
        <h2 id="description-heading" className="text-lg font-semibold text-foreground">
          Description
        </h2>
        <ProductDescription html={product.description} />
      </section>

      {relatedProducts.length > 0 ? (
        <section
          className="mt-12 border-t border-border pt-8 sm:mt-16 sm:pt-12"
          aria-labelledby="related-heading"
        >
          <h2
            id="related-heading"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            Related products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            More items in {product.categoryName}
          </p>
          <div className="mt-8">
            <ProductGrid products={relatedProducts} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
