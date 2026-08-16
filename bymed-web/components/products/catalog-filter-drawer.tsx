"use client";

import { ProductFilterSidebar } from "@/components/products/product-filter-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CategoryDto } from "@/types/category";
import { useState } from "react";

type CatalogFilterDrawerProps = {
  categories: CategoryDto[];
  catalogPath: string;
  categorySlug?: string;
  q?: string;
  brand?: string;
  clientType?: string;
  minPrice?: number;
  maxPrice?: number;
};

function IconSliders({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </svg>
  );
}

export function CatalogFilterDrawer(props: CatalogFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    props.categorySlug,
    props.q,
    props.brand,
    props.clientType,
    props.minPrice != null,
    props.maxPrice != null,
  ].filter(Boolean).length;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 shrink-0 rounded-full border-border/70 px-4 lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <IconSliders className="mr-2" />
        Filters
        {activeCount > 0 ? (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[min(100%,20rem)] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <ProductFilterSidebar
            {...props}
            embedded
            className="px-5 py-4"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
