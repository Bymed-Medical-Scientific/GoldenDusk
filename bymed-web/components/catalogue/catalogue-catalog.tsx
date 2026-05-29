import { CatalogueGrid } from "@/components/catalogue/catalogue-grid";
import { CataloguePagination } from "@/components/catalogue/catalogue-pagination";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import {
  buildCatalogueHref,
  categoryCataloguePath,
  type CatalogueQuery,
} from "@/lib/catalogue/catalogue-params";
import { resolveProductImageUrl } from "@/lib/catalog/resolve-product-image-url";
import { listCatalogueItems } from "@/lib/api/catalogue-items";
import { ApiError } from "@/lib/api/http";
import Link from "next/link";
import { redirect } from "next/navigation";

export type CatalogueCatalogProps = {
  query: CatalogueQuery;
  categorySlug?: string;
  categoryName?: string;
};

export async function CatalogueCatalog({
  query,
  categorySlug,
  categoryName,
}: CatalogueCatalogProps) {
  const catalogPath = categorySlug
    ? categoryCataloguePath(categorySlug)
    : "/catalogue";

  const hrefOpts = {
    q: query.q,
    brand: query.brand,
    categorySlug,
  };

  const pageTitle = categoryName ?? "Catalogue";

  let result;
  try {
    result = await listCatalogueItems({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      search: query.q,
      categoryId: query.categoryId,
      brand: query.brand,
    });
  } catch (e) {
    const message =
      e instanceof ApiError
        ? e.message
        : process.env.NODE_ENV === "development" && e instanceof Error
          ? `We could not load the catalogue. ${e.message}`
          : "We could not load the catalogue. Please try again shortly.";
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
        <p className="mt-4 text-muted-foreground" role="alert">
          {message}
        </p>
        <p className="mt-6">
          <Link href={catalogPath} className="text-sm font-medium text-brand hover:underline">
            Try again
          </Link>
        </p>
      </div>
    );
  }

  if (result.totalPages > 0 && query.pageNumber > result.totalPages) {
    redirect(
      buildCatalogueHref({
        ...hrefOpts,
        page: result.totalPages,
      }),
    );
  }

  const cardItems = result.items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    imageUrl: resolveProductImageUrl(item.primaryImageUrl),
    imageAlt: item.name,
    categoryName: item.categoryName,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="sr-only">{pageTitle}</h1>
      <header className="mb-7 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <form action={catalogPath} method="get" className="min-w-0 flex-1">
          <label htmlFor="catalogue-search" className="sr-only">
            Search catalogue
          </label>
          <div className="relative">
            <Input
              id="catalogue-search"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Search catalogue..."
              className="h-11 rounded-full border-border/70 bg-muted/40 pl-10 pr-4"
            />
          </div>
        </form>
      </header>
      <div className="min-w-0">
        {result.items.length === 0 ? (
          <EmptyState
            message={
              query.q || query.brand || query.categoryId
                ? "No items match your filters."
                : "No catalogue items are available yet."
            }
          />
        ) : (
          <>
            <CatalogueGrid items={cardItems} />
            <CataloguePagination
              pageNumber={result.pageNumber}
              totalPages={result.totalPages}
              q={query.q}
              brand={query.brand}
              categorySlug={categorySlug}
            />
          </>
        )}
      </div>
    </div>
  );
}
