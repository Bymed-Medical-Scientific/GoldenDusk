"use client";

import { CurrencySelector } from "@/components/currency/currency-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildProductsHref,
  categoryProductsPath,
  hasActiveCatalogFilters,
} from "@/lib/catalog/catalog-params";
import { cn } from "@/lib/utils";
import type { CategoryDto } from "@/types/category";
import Link from "next/link";

export type ProductFilterSidebarProps = {
  categories: CategoryDto[];
  catalogPath?: string;
  categorySlug?: string;
  q?: string;
  brand?: string;
  clientType?: string;
  minPrice?: number;
  maxPrice?: number;
  className?: string;
  /** When true, omits the outer card chrome (e.g. inside a mobile sheet). */
  embedded?: boolean;
};

function CategoryFilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-brand/10 font-medium text-brand"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function ProductFilterSidebar({
  categories,
  catalogPath = "/products",
  categorySlug,
  q,
  brand,
  clientType,
  minPrice,
  maxPrice,
  className,
  embedded = false,
}: ProductFilterSidebarProps) {
  const filterHrefOpts = { q, brand, clientType, minPrice, maxPrice };
  const sortedCategories = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );
  const filtersActive = hasActiveCatalogFilters({
    q,
    brand,
    clientType,
    minPrice,
    maxPrice,
    categorySlug,
  });
  const clearHref = categorySlug
    ? categoryProductsPath(categorySlug)
    : "/products";

  return (
    <aside
      className={cn(
        embedded
          ? className
          : cn(
              "rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:sticky lg:top-24",
              className,
            ),
      )}
      aria-label="Product filters"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Filters
        </h2>
        {filtersActive ? (
          <Link
            href={clearHref}
            className="text-xs font-medium text-brand hover:underline"
          >
            Clear all
          </Link>
        ) : null}
      </div>

      <div className="mt-5 space-y-6">
        <section>
          <Label htmlFor="catalog-filter-currency" className="text-sm font-medium">
            Currency
          </Label>
          <CurrencySelector
            variant="drawer"
            className="mt-2"
            selectId="catalog-filter-currency"
          />
        </section>

        <section>
          <h3 className="text-sm font-medium text-foreground">Category</h3>
          <nav
            className="mt-2 flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1"
            aria-label="Filter by category"
          >
            <CategoryFilterLink
              href={buildProductsHref(filterHrefOpts)}
              active={!categorySlug}
            >
              All products
            </CategoryFilterLink>
            {sortedCategories.map((category) => (
              <CategoryFilterLink
                key={category.id}
                href={buildProductsHref({
                  ...filterHrefOpts,
                  categorySlug: category.slug,
                })}
                active={categorySlug === category.slug}
              >
                {category.name}
              </CategoryFilterLink>
            ))}
          </nav>
        </section>

        <section>
          <h3 className="text-sm font-medium text-foreground">Price range</h3>
          <form action={catalogPath} method="get" className="mt-2 space-y-2.5">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {brand ? <input type="hidden" name="brand" value={brand} /> : null}
            {clientType ? (
              <input type="hidden" name="clientType" value={clientType} />
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="catalog-min-price" className="sr-only">
                  Minimum price
                </Label>
                <Input
                  id="catalog-min-price"
                  name="minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={minPrice ?? ""}
                  placeholder="Min"
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="catalog-max-price" className="sr-only">
                  Maximum price
                </Label>
                <Input
                  id="catalog-max-price"
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={maxPrice ?? ""}
                  placeholder="Max"
                  className="h-10"
                />
              </div>
            </div>
            <Button type="submit" size="sm" className="h-9 w-full">
              Apply price
            </Button>
          </form>
        </section>
      </div>
    </aside>
  );
}
