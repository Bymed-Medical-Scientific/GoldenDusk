"use client";

import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCart } from "@/components/cart/cart-context";
import Link from "next/link";
import { useMemo, useState } from "react";

const FALLBACK_CURRENCY = "USD";

export function CartPageContent() {
  const { items, totalItems, total, isLoading, error, updateQuantity, removeItem } = useCart();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const currency = useMemo(
    () => items.find((item) => item.product?.currency)?.product?.currency ?? FALLBACK_CURRENCY,
    [items],
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Loading your cart...</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        <p className="text-muted-foreground">Your cart is empty. Browse products to add items.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        {error ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {items.map((item) => {
          const title = item.product?.name ?? "Product";
          const unavailable = item.product?.isAvailable === false;
          const disabled = busyItemId === item.productId;
          return (
            <CartItem
              key={item.productId}
              productId={item.productId}
              productName={title}
              currency={item.product?.currency ?? FALLBACK_CURRENCY}
              unitPrice={item.unitPrice}
              quantity={item.quantity}
              lineTotal={item.quantity * item.unitPrice}
              isAvailable={!unavailable}
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
        <CartSummary totalItems={totalItems} total={total} currency={currency} />
      </div>
    </div>
  );
}
