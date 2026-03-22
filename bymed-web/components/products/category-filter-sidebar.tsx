import { buildProductsHref } from "@/lib/catalog/catalog-params";
import type { CategoryDto } from "@/types/category";
import Link from "next/link";

type CategoryFilterSidebarProps = {
  categories: CategoryDto[];
  activeCategoryId?: string;
  q?: string;
};

export function CategoryFilterSidebar({
  categories,
  activeCategoryId,
  q,
}: CategoryFilterSidebarProps) {
  const sorted = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );

  const allHref = buildProductsHref({ q, categoryId: undefined, page: 1 });

  return (
    <aside
      className="rounded-xl border border-border bg-muted/20 p-4 lg:bg-transparent lg:p-0"
      aria-label="Filter by category"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Categories
      </h2>
      <ul className="mt-3 flex flex-col gap-0.5">
        <li>
          <Link
            href={allHref}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              !activeCategoryId
                ? "bg-brand text-brand-foreground"
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
            categoryId: c.id,
            page: 1,
          });
          return (
            <li key={c.id}>
              <Link
                href={href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-brand-foreground"
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
    </aside>
  );
}
