import { CatalogFilterDrawer } from "@/components/products/catalog-filter-drawer";
import { CatalogPagination } from "@/components/products/catalog-pagination";
import { ProductFilterSidebar } from "@/components/products/product-filter-sidebar";
import { ProductGrid } from "@/components/products/product-grid";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import {
  buildProductsHref,
  categoryProductsPath,
  hasActiveCatalogFilters,
  type CatalogQuery,
} from "@/lib/catalog/catalog-params";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { listCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import type { CategoryDto } from "@/types/category";
import Link from "next/link";
import { redirect } from "next/navigation";

export type ProductsCatalogProps = {
  query: CatalogQuery;
  categorySlug?: string;
  categoryName?: string;
};

function formatResultsSummary(
  pageNumber: number,
  pageSize: number,
  totalCount: number,
): string {
  if (totalCount === 0) return "No products found";
  const start = (pageNumber - 1) * pageSize + 1;
  const end = Math.min(pageNumber * pageSize, totalCount);
  if (totalCount === 1) return "1 product";
  if (start === end) return `${start} of ${totalCount} products`;
  return `${start}–${end} of ${totalCount} products`;
}

export async function ProductsCatalog({
  query,
  categorySlug,
  categoryName,
}: ProductsCatalogProps) {
  const catalogPath = categorySlug
    ? categoryProductsPath(categorySlug)
    : "/products";

  const hrefOpts = {
    q: query.q,
    brand: query.brand,
    clientType: query.clientType,
    categorySlug,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
  };

  const pageTitle = categoryName ?? "Products";
  const filtersActive = hasActiveCatalogFilters({ ...hrefOpts, categorySlug });
  const clearHref = categorySlug ? categoryProductsPath(categorySlug) : "/products";

  const categories: CategoryDto[] = await listCategories().catch(() => []);

  let productResult;
  try {
    productResult = await listProducts({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      search: query.q,
      categoryId: query.categoryId,
      brand: query.brand,
      clientType: query.clientType,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });
  } catch (e) {
    const message =
      e instanceof ApiError
        ? e.message
        : process.env.NODE_ENV === "development" && e instanceof Error
          ? `We could not load products. ${e.message}`
          : "We could not load products. Please try again shortly.";
    return (
      <CatalogLoadError
        title={pageTitle}
        catalogPath={catalogPath}
        message={message}
      />
    );
  }

  if (
    productResult.totalPages > 0 &&
    query.pageNumber > productResult.totalPages
  ) {
    redirect(
      buildProductsHref({
        ...hrefOpts,
        page: productResult.totalPages,
      }),
    );
  }

  const cardProducts = productResult.items.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: resolveProductImageUrl(p.primaryImageUrl),
    imageAlt: p.name,
    price: p.price,
    currency: p.currency,
    isAvailable: p.isAvailable,
    categoryName: p.categoryName,
  }));

  const filterProps = {
    categories,
    catalogPath,
    categorySlug,
    q: query.q,
    brand: query.brand,
    clientType: query.clientType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatResultsSummary(
            productResult.pageNumber,
            productResult.pageSize,
            productResult.totalCount,
          )}
        </p>
      </div>

      <header className="mb-6 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form action={catalogPath} method="get" className="min-w-0 flex-1">
            {query.minPrice != null ? (
              <input type="hidden" name="minPrice" value={query.minPrice} />
            ) : null}
            {query.maxPrice != null ? (
              <input type="hidden" name="maxPrice" value={query.maxPrice} />
            ) : null}
            <label htmlFor="catalog-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Input
                id="catalog-search"
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Search products..."
                className="h-11 rounded-full border-border/70 bg-muted/40 pl-10 pr-4"
              />
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </form>
          <div className="flex items-center gap-2 sm:gap-3">
            <CatalogFilterDrawer {...filterProps} />
            {filtersActive ? (
              <Link
                href={clearHref}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <div className="hidden lg:block">
          <ProductFilterSidebar {...filterProps} />
        </div>
        <div className="min-w-0">
          {productResult.items.length === 0 ? (
            <EmptyState
              message={
                filtersActive || query.categoryId
                  ? "No products match your filters. Try broadening your criteria."
                  : "No products are available yet."
              }
            />
          ) : (
            <>
              <ProductGrid products={cardProducts} />
              <CatalogPagination
                pageNumber={productResult.pageNumber}
                totalPages={productResult.totalPages}
                q={query.q}
                brand={query.brand}
                clientType={query.clientType}
                categorySlug={categorySlug}
                minPrice={query.minPrice}
                maxPrice={query.maxPrice}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogLoadError({
  title,
  catalogPath,
  message,
}: {
  title: string;
  catalogPath: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-4 text-muted-foreground" role="alert">
        {message}
      </p>
      <p className="mt-6">
        <Link
          href={catalogPath}
          className="text-sm font-medium text-brand hover:underline"
        >
          Try again
        </Link>
      </p>
    </div>
  );
}
