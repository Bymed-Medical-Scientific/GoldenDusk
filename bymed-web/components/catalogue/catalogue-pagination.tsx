import { buildCatalogueHref } from "@/lib/catalogue/catalogue-params";
import Link from "next/link";

type CataloguePaginationProps = {
  pageNumber: number;
  totalPages: number;
  q?: string;
  brand?: string;
  categorySlug?: string;
};

export function CataloguePagination({
  pageNumber,
  totalPages,
  q,
  brand,
  categorySlug,
}: CataloguePaginationProps) {
  if (totalPages <= 1) return null;

  const prev =
    pageNumber > 1
      ? buildCatalogueHref({ q, brand, categorySlug, page: pageNumber - 1 })
      : null;
  const next =
    pageNumber < totalPages
      ? buildCatalogueHref({ q, brand, categorySlug, page: pageNumber + 1 })
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
      aria-label="Catalogue pagination"
    >
      {prev ? (
        <Link
          href={prev}
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {"<"}
        </Link>
      ) : (
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-transparent px-3 text-sm text-muted-foreground">
          {"<"}
        </span>
      )}
      <ul className="flex flex-wrap items-center gap-1">
        {pages.map((p) => {
          const active = p === pageNumber;
          const href = buildCatalogueHref({ q, brand, categorySlug, page: p });
          return (
            <li key={p}>
              {active ? (
                <span
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-brand px-3 text-sm font-semibold text-brand-foreground"
                  aria-current="page"
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={href}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {">"}
        </Link>
      ) : (
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-transparent px-3 text-sm text-muted-foreground">
          {">"}
        </span>
      )}
    </nav>
  );
}
