import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductDescription } from "@/components/products/product-description";
import { CatalogueBrandLink } from "@/components/catalogue/catalogue-brand-link";
import type { CatalogueCardItem } from "@/components/catalogue/catalogue-card";
import { CatalogueGrid } from "@/components/catalogue/catalogue-grid";
import type { GalleryImage } from "@/lib/catalogue/catalogue-gallery-images";
import type { CatalogueItemDto } from "@/types/catalogue-item";
import dynamic from "next/dynamic";
import Link from "next/link";

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

type CatalogueDetailProps = {
  item: CatalogueItemDto;
  galleryImages: GalleryImage[];
  relatedItems: CatalogueCardItem[];
};

export function CatalogueDetail({
  item,
  galleryImages,
  relatedItems,
}: CatalogueDetailProps) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <nav className="mb-6 min-w-0 max-w-full overflow-x-hidden text-muted-foreground sm:mb-8" aria-label="Breadcrumb">
        <ol className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          <li>
            <Link href="/catalogue" className="font-medium text-brand hover:underline">
              Catalogue
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="min-w-0 flex-1 break-words text-foreground">{item.name}</li>
        </ol>
      </nav>

      <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="min-w-0 w-full">
          <ProductImageGallery images={galleryImages} productName={item.name} />
        </div>

        <div className="min-w-0 w-full">
          <p className="text-sm font-medium text-muted-foreground">{item.categoryName}</p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {item.name}
          </h1>

          {item.brandWebsiteUrl?.trim() ? (
            <div className="mt-4">
              <CatalogueBrandLink
                name={item.brandName?.trim() || "Brand"}
                logoUrl={item.brandLogoUrl}
                websiteUrl={item.brandWebsiteUrl}
              />
            </div>
          ) : item.brandName?.trim() ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Brand: <span className="text-foreground">{item.brandName.trim()}</span>
            </p>
          ) : null}

          <p className="mt-4 text-base font-medium text-muted-foreground">
            Request a quotation for pricing and availability.
          </p>

          <div className="mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
            <AddToCartButton
              productId={item.id}
              productName={item.name}
              productPrice={0}
              productCurrency="USD"
              productImageUrl={item.primaryImageUrl}
              disabled={!item.isPublished}
            />
          </div>
        </div>
      </div>

      <section className="mt-10 w-full min-w-0 max-w-full border-t border-border pt-6 sm:mt-12 sm:pt-8" aria-labelledby="description-heading">
        <h2 id="description-heading" className="text-lg font-semibold text-foreground">
          Description
        </h2>
        <ProductDescription html={item.description} />
      </section>

      {relatedItems.length > 0 ? (
        <section className="mt-12 border-t border-border pt-8 sm:mt-16 sm:pt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xl font-semibold tracking-tight text-foreground">
            Related items
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">More in {item.categoryName}</p>
          <div className="mt-8">
            <CatalogueGrid items={relatedItems} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
