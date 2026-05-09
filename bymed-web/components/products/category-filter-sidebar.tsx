import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildProductsHref } from "@/lib/catalog/catalog-params";
import Link from "next/link";

type CategoryFilterSidebarProps = {
  activeCategoryId?: string;
  q?: string;
  brand?: string;
  clientType?: string;
  minPrice?: number;
  maxPrice?: number;
};

export function CategoryFilterSidebar({
  activeCategoryId,
  q,
  brand,
  clientType,
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
          <label htmlFor="client-type-filter" className="sr-only">
            Filter by client type
          </label>
          <select
            id="client-type-filter"
            name="clientType"
            defaultValue={clientType ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All client types</option>
            <option value="school">School</option>
            <option value="university-college">University/College</option>
            <option value="hospital-clinic">Hospital/Clinic</option>
            <option value="nursing-school">Nursing School</option>
          </select>
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
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="h-9 px-3.5">
              Apply
            </Button>
            {brand || clientType || minPrice != null || maxPrice != null ? (
              <Link
                href={buildProductsHref({
                  q,
                  categoryId: activeCategoryId,
                  brand: undefined,
                  clientType: undefined,
                  minPrice: undefined,
                  maxPrice: undefined,
                  page: 1,
                })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear
              </Link>
            ) : null}
          </div>
      </form>
    </aside>
  );
}
