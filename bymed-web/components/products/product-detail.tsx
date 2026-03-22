import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import type { ProductCardProduct } from "@/components/products/product-card";
import { ProductGrid } from "@/components/products/product-grid";
import { FormattedPrice } from "@/components/price/formatted-price";
import type { GalleryImage } from "@/lib/catalog/product-gallery-images";
import type { ProductDto } from "@/types/product";
import Link from "next/link";

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <ProductImageGallery
          images={galleryImages}
          productName={product.name}
        />

        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {product.categoryName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          {product.sku?.trim() ? (
            <p className="mt-2 text-sm text-muted-foreground">
              SKU:{" "}
              <span className="font-mono text-foreground">{product.sku.trim()}</span>
            </p>
          ) : null}

          <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">
            <FormattedPrice amount={product.price} currency={product.currency} />
          </p>

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

          <div className="mt-8 border-t border-border pt-8">
            <AddToCartButton
              productId={product.id}
              disabled={!inStock}
              maxQuantity={product.inventoryCount}
            />
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          {specEntries.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-foreground">
                Specifications
              </h2>
              <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
                {specEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-muted-foreground">
                      {key}
                    </dt>
                    <dd className="text-sm text-foreground sm:col-span-2">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section
          className="mt-16 border-t border-border pt-12"
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
