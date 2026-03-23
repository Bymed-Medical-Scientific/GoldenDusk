import { buildProductsHref } from "@/lib/catalog/catalog-params";
import Link from "next/link";

type CatalogPaginationProps = {
  pageNumber: number;
  totalPages: number;
  q?: string;
  categoryId?: string;
};

export function CatalogPagination({
  pageNumber,
  totalPages,
  q,
  categoryId,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const prev =
    pageNumber > 1
      ? buildProductsHref({ q, categoryId, page: pageNumber - 1 })
      : null;
  const next =
    pageNumber < totalPages
      ? buildProductsHref({ q, categoryId, page: pageNumber + 1 })
      : null;

  const windowSize = 5;
  let start = Math.max(1, pageNumber - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Product list pagination"
    >
      {prev ? (
        <Link
          href={prev}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground">
          Previous
        </span>
      )}
      <ul className="flex flex-wrap items-center gap-1">
        {pages.map((p) => {
          const active = p === pageNumber;
          const href = buildProductsHref({ q, categoryId, page: p });
          return (
            <li key={p}>
              {active ? (
                <span
                  className="inline-flex min-w-[2.25rem] justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
                  aria-current="page"
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={href}
                  className="inline-flex min-w-[2.25rem] justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {p}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {next ? (
        <Link
          href={next}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground">
          Next
        </span>
      )}
    </nav>
  );
}
