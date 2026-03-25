import { CatalogPagination } from "@/components/products/catalog-pagination";
import { CategoryFilterSidebar } from "@/components/products/category-filter-sidebar";
import { ProductGrid } from "@/components/products/product-grid";
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
  const { q } = parseCatalogQuery(searchParams);
  const title = q
    ? `Products — “${q}” | Bymed Medical & Scientific`
    : "Products | Bymed Medical & Scientific";
  const description = q
    ? `Browse products matching “${q}” at Bymed Medical & Scientific.`
    : "Browse medical and scientific equipment and supplies at Bymed Medical & Scientific.";
  const canonical = absoluteUrl(
    q ? `/products?q=${encodeURIComponent(q)}` : "/products",
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
    });
  } catch (e) {
    const message =
      e instanceof ApiError
        ? e.message
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {query.q ? `Results for “${query.q}”` : "Products"}
        </h1>
        {query.q || query.categoryId ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href="/products" className="font-medium text-brand hover:underline">
              Clear filters
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Browse our catalog. Use the search bar or categories to narrow results.
          </p>
        )}
        {catalogError ? (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            {catalogError}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="lg:w-56 lg:flex-shrink-0">
          <CategoryFilterSidebar
            categories={categories}
            activeCategoryId={query.categoryId}
            q={query.q}
          />
        </div>

        <div className="min-w-0 flex-1">
          {productResult.items.length === 0 ? (
            <EmptyState
              message={
                query.q || query.categoryId
                  ? "No products match your filters. Try different search terms or categories."
                  : "No products are available yet."
              }
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
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
                categoryId={query.categoryId}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
