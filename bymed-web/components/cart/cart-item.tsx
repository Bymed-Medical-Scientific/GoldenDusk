"use client";

import { FormattedPrice } from "@/components/price/formatted-price";
import Link from "next/link";

type CartItemProps = {
  productId: string;
  productName: string;
  currency: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isAvailable: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function CartItem({
  productId,
  productName,
  currency,
  unitPrice,
  quantity,
  lineTotal,
  isAvailable,
  onDecrease,
  onIncrease,
  onRemove,
  disabled = false,
}: CartItemProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/products/${productId}`} className="text-base font-semibold text-foreground hover:underline">
            {productName}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Unit price: <FormattedPrice amount={unitPrice} currency={currency} />
          </p>
          {!isAvailable ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">Currently unavailable</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-md border border-border">
          <button
            type="button"
            onClick={onDecrease}
            disabled={disabled || quantity <= 1}
            className="px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Decrease ${productName} quantity`}
          >
            -
          </button>
          <span className="min-w-10 px-3 py-1.5 text-center text-sm font-medium tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            disabled={disabled}
            className="px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Increase ${productName} quantity`}
          >
            +
          </button>
        </div>
        <p className="text-base font-semibold tabular-nums text-foreground">
          <FormattedPrice amount={lineTotal} currency={currency} />
        </p>
      </div>
    </article>
  );
}
