import { CatalogPagination } from "@/components/products/catalog-pagination";
import { CategoryFilterSidebar } from "@/components/products/category-filter-sidebar";
import { ProductGrid } from "@/components/products/product-grid";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import {
  buildProductsHref,
  categoryProductsPath,
  type CatalogQuery,
} from "@/lib/catalog/catalog-params";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import { BYMED_ACCESS_COOKIE, BYMED_REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export type ProductsCatalogProps = {
  query: CatalogQuery;
  categorySlug?: string;
  categoryName?: string;
};

export async function ProductsCatalog({
  query,
  categorySlug,
  categoryName,
}: ProductsCatalogProps) {
  const cookieStore = cookies();
  const isAuthenticated =
    Boolean(cookieStore.get(BYMED_ACCESS_COOKIE)?.value) ||
    Boolean(cookieStore.get(BYMED_REFRESH_COOKIE)?.value);

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
      <h1 className="sr-only">{pageTitle}</h1>
      <header className="mb-7 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form action={catalogPath} method="get" className="min-w-0 flex-1">
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
            <Link
              href={buildProductsHref(hrefOpts)}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Clear search
            </Link>
          </div>
        </div>
      </header>
      <div
        className={
          isAuthenticated
            ? "grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start"
            : "min-w-0"
        }
      >
        {isAuthenticated ? (
          <CategoryFilterSidebar
            catalogPath={catalogPath}
            q={query.q}
            minPrice={query.minPrice}
            maxPrice={query.maxPrice}
          />
        ) : null}
        <div className="min-w-0">
          {productResult.items.length === 0 ? (
            <EmptyState
              message={
                query.q || query.brand || query.clientType || query.categoryId
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