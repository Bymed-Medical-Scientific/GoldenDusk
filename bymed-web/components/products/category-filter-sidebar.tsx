"use client";

import { CurrencySelector } from "@/components/currency/currency-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CategoryFilterSidebarProps = {
  activeCategoryId?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
};

export function CategoryFilterSidebar({
  activeCategoryId,
  q,
  minPrice,
  maxPrice,
}: CategoryFilterSidebarProps) {
  return (
    <aside
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
      aria-label="Product filters"
    >
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        Filters
      </h2>
      <form action="/products" method="get" className="mt-3 space-y-2.5">
        {q ? <input type="hidden" name="q" value={q} /> : null}
        {activeCategoryId ? (
          <input type="hidden" name="category" value={activeCategoryId} />
        ) : null}
        <CurrencySelector
          variant="drawer"
          className="w-full"
          selectId="products-filter-currency"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={minPrice ?? ""}
            placeholder="Min price"
            className="h-10"
          />
          <Input
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={maxPrice ?? ""}
            placeholder="Max price"
            className="h-10"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 px-3.5">
          Apply
        </Button>
      </form>
    </aside>
  );
}
