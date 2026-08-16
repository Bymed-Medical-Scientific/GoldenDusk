"use client";

import { FormattedPrice } from "@/components/price/formatted-price";
import Link from "next/link";

type CartSummaryProps = {
  totalItems: number;
  total: number;
  currency: string;
};

export function CartSummary({ totalItems, total, currency }: CartSummaryProps) {
  const hasItems = totalItems > 0;
  return (
    <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Items</dt>
          <dd className="font-medium tabular-nums text-foreground">{totalItems}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <dt className="text-base font-semibold text-foreground">Total</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">
            <FormattedPrice amount={total} currency={currency} />
          </dd>
        </div>
      </dl>
      {hasItems ? (
        <Link
          href="/checkout"
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
        >
          Proceed to checkout
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground opacity-50"
        >
          Proceed to checkout
        </button>
      )}
    </aside>
  );
}
