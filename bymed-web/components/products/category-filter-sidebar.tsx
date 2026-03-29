import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildProductsHref } from "@/lib/catalog/catalog-params";
import type { CategoryDto } from "@/types/category";
import Link from "next/link";

type CategoryFilterSidebarProps = {
  categories: CategoryDto[];
  activeCategoryId?: string;
  q?: string;
  brand?: string;
};

export function CategoryFilterSidebar({
  categories,
  activeCategoryId,
  q,
  brand,
}: CategoryFilterSidebarProps) {
  const sorted = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );

  const allHref = buildProductsHref({
    q,
    brand,
    categoryId: undefined,
    page: 1,
  });

  return (
    <aside
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
      aria-label="Filter by category"
    >
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        Categories
      </h2>
      <ul className="mt-3 flex flex-col gap-1">
        <li>
          <Link
            href={allHref}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              !activeCategoryId
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-foreground hover:bg-muted"
            }`}
            aria-current={!activeCategoryId ? "page" : undefined}
          >
            All products
          </Link>
        </li>
        {sorted.map((c) => {
          const active = c.id === activeCategoryId;
          const href = buildProductsHref({
            q,
            brand,
            categoryId: c.id,
            page: 1,
          });
          return (
            <li key={c.id}>
              <Link
                href={href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 border-t border-border/70 pt-5">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Brand
        </h3>
        <form action="/products" method="get" className="mt-3 space-y-2.5">
          {q ? <input type="hidden" name="q" value={q} /> : null}
          {activeCategoryId ? (
            <input type="hidden" name="category" value={activeCategoryId} />
          ) : null}
          <label htmlFor="brand-filter" className="sr-only">
            Filter by brand
          </label>
          <Input
            id="brand-filter"
            name="brand"
            defaultValue={brand ?? ""}
            placeholder="e.g. Siemens"
            className="h-10"
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="h-9 px-3.5">
              Apply
            </Button>
            {brand ? (
              <Link
                href={buildProductsHref({
                  q,
                  categoryId: activeCategoryId,
                  page: 1,
                })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </div>
    </aside>
  );
}
