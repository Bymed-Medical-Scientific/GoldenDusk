"use client";

import { CartItem } from "@/components/cart/cart-item";
import { useQuoteCart } from "@/components/cart/quote-cart-context";
import Link from "next/link";
import { useState } from "react";

const FALLBACK_CURRENCY = "USD";

export function QuoteCartPageContent() {
  const { items, totalItems, isLoading, error, updateQuantity, removeItem } = useQuoteCart();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading your quote cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        <p className="text-muted-foreground">
          Your quote cart is empty. Add catalogue items or products to request a quotation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/catalogue"
            className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
          >
            Browse catalogue
          </Link>
          <Link
            href="/products"
            className="inline-flex rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}
        {items.map((item) => {
          const title = item.product?.name ?? "Item";
          const disabled = busyItemId === item.productId;
          return (
            <CartItem
              key={item.productId}
              productId={item.productId}
              productName={title}
              currency={item.product?.currency ?? FALLBACK_CURRENCY}
              unitPrice={0}
              quantity={item.quantity}
              lineTotal={0}
              isAvailable
              showPrices={false}
              disabled={disabled}
              onDecrease={() => {
                if (item.quantity <= 1 || disabled) return;
                setBusyItemId(item.productId);
                void updateQuantity(item.productId, item.quantity - 1).finally(() =>
                  setBusyItemId(null),
                );
              }}
              onIncrease={() => {
                if (disabled) return;
                setBusyItemId(item.productId);
                void updateQuantity(item.productId, item.quantity + 1).finally(() =>
                  setBusyItemId(null),
                );
              }}
              onRemove={() => {
                if (disabled) return;
                setBusyItemId(item.productId);
                void removeItem(item.productId).finally(() => setBusyItemId(null));
              }}
            />
          );
        })}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Quote summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Items</dt>
              <dd className="font-medium tabular-nums text-foreground">{totalItems}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            Pricing will be provided after you submit your quote request.
          </p>
          {totalItems > 0 ? (
            <Link
              href="/quote"
              className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
            >
              Request quotation
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground opacity-50"
            >
              Request quotation
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
