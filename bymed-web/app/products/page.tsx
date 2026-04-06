import { CatalogPagination } from "@/components/products/catalog-pagination";
import { ProductGrid } from "@/components/products/product-grid";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import {
  buildProductsHref,
  parseCatalogQuery,
} from "@/lib/catalog/catalog-params";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

type ProductsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { q } = parseCatalogQuery(searchParams);
  const title = q
    ? `Products — “${q}” | Bymed Medical & Scientific`
    : "Products | Bymed Medical & Scientific";
  const description = q
    ? `Browse products matching “${q}” at Bymed Medical & Scientific.`
    : "Browse medical and scientific equipment and supplies at Bymed Medical & Scientific.";
  const canonical = absoluteUrl(
    buildProductsHref({ q }),
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

  let productResult;
  try {
    productResult = await listProducts({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      search: query.q,
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
      <header className="mb-7 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form action="/products" method="get" className="min-w-0 flex-1">
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
              href="/products"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Clear search
            </Link>
            <CurrencySelector
              variant="drawer"
              className="w-40 shrink-0"
              selectId="products-currency"
            />
          </div>
        </div>
      </header>
      <div className="min-w-0">
        {productResult.items.length === 0 ? (
          <EmptyState
            message={
              query.q
                ? "No products match your search. Try a different term."
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
            />
          </>
        )}
      </div>
    </div>
  );
}
