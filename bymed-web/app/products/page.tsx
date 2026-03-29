import { CatalogPagination } from "@/components/products/catalog-pagination";
import { CategoryFilterSidebar } from "@/components/products/category-filter-sidebar";
import { ProductGrid } from "@/components/products/product-grid";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import {
  buildProductsHref,
  parseCatalogQuery,
} from "@/lib/catalog/catalog-params";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { listCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/site-url";
import type { CategoryDto } from "@/types/category";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

type ProductsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { q, brand } = parseCatalogQuery(searchParams);
  const title = q
    ? `Products — “${q}” | Bymed Medical & Scientific`
    : brand
      ? `Products — Brand: ${brand} | Bymed Medical & Scientific`
    : "Products | Bymed Medical & Scientific";
  const description = q
    ? `Browse products matching “${q}” at Bymed Medical & Scientific.`
    : brand
      ? `Browse products for brand ${brand} at Bymed Medical & Scientific.`
    : "Browse medical and scientific equipment and supplies at Bymed Medical & Scientific.";
  const canonical = absoluteUrl(
    buildProductsHref({ q, brand }),
  );
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = parseCatalogQuery(searchParams);

  let categories: CategoryDto[] = [];
  let catalogError: string | null = null;
  try {
    categories = await listCategories();
  } catch {
    categories = [];
    catalogError =
      "Categories could not be loaded. You can still browse products.";
  }

  let productResult;
  try {
    productResult = await listProducts({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      categoryId: query.categoryId,
      search: query.q,
      brand: query.brand,
    });
  } catch (e) {
    const message =
      e instanceof ApiError
        ? e.message
        : process.env.NODE_ENV === "development" && e instanceof Error
          ? `We could not load products. ${e.message}`
          : "We could not load products. Please try again shortly.";
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Products
        </h1>
        <p className="mt-4 text-muted-foreground" role="alert">
          {message}
        </p>
        <p className="mt-6">
          <Link
            href="/products"
            className="text-sm font-medium text-brand hover:underline"
          >
            Back to all products
          </Link>
        </p>
      </div>
    );
  }

  if (
    productResult.totalPages > 0 &&
    query.pageNumber > productResult.totalPages
  ) {
    redirect(
      buildProductsHref({
        q: query.q,
        brand: query.brand,
        categoryId: query.categoryId,
        page: productResult.totalPages,
      }),
    );
  }

  const cardProducts = productResult.items.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: resolveProductImageUrl(p.primaryImageUrl),
    imageAlt: p.name,
    price: p.price,
    currency: p.currency,
    isAvailable: p.isAvailable,
    inventoryCount: p.inventoryCount,
    categoryName: p.categoryName,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Laboratory / Equipment
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {query.q ? `Scientific Instruments - "${query.q}"` : "Scientific Instruments"}{" "}
            <span className="align-middle text-lg font-medium text-muted-foreground">
              ({productResult.totalCount} Results)
            </span>
          </h1>
          <div className="flex w-full max-w-xl items-center gap-3">
            <form action="/products" method="get" className="w-full max-w-md">
              {query.categoryId ? (
                <input type="hidden" name="category" value={query.categoryId} />
              ) : null}
              {query.brand ? (
                <input type="hidden" name="brand" value={query.brand} />
              ) : null}
              <label htmlFor="catalog-search" className="sr-only">
                Search equipment
              </label>
              <div className="relative">
                <Input
                  id="catalog-search"
                  name="q"
                  defaultValue={query.q ?? ""}
                  placeholder="Search equipment..."
                  className="h-11 rounded-full bg-muted/45 pl-10 pr-4"
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
            <CurrencySelector
              variant="drawer"
              className="w-40 shrink-0"
              selectId="products-currency"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          {(query.q || query.brand || query.categoryId) && (
            <Link href="/products" className="font-medium text-primary hover:underline">
              Clear filters
            </Link>
          )}
          {catalogError ? (
            <p className="text-muted-foreground" role="status">
              {catalogError}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-8">
        <div className="lg:w-64 lg:flex-shrink-0">
          <CategoryFilterSidebar
            categories={categories}
            activeCategoryId={query.categoryId}
            q={query.q}
            brand={query.brand}
          />
        </div>

        <div className="min-w-0 flex-1">
          {productResult.items.length === 0 ? (
            <EmptyState
              message={
                query.q || query.brand || query.categoryId
                  ? "No products match your filters. Try different search terms or categories."
                  : "No products are available yet."
              }
            />
          ) : (
            <>
              <p className="mb-5 text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(query.pageNumber - 1) * query.pageSize + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {Math.min(
                    query.pageNumber * query.pageSize,
                    productResult.totalCount,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {productResult.totalCount}
                </span>
              </p>
              <ProductGrid products={cardProducts} />
              <CatalogPagination
                pageNumber={productResult.pageNumber}
                totalPages={productResult.totalPages}
                q={query.q}
                brand={query.brand}
                categoryId={query.categoryId}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
