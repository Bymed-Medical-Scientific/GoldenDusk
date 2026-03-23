"use client";

import { addCartItem } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/http";
import Link from "next/link";
import { useCallback, useState } from "react";

type AddToCartButtonProps = {
  productId: string;
  disabled: boolean;
  maxQuantity: number;
};

export function AddToCartButton({
  productId,
  disabled,
  maxQuantity,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cap = Math.max(1, Math.min(maxQuantity, 99));

  const onAdd = useCallback(async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const qty = Math.min(Math.max(1, quantity), cap);
      await addCartItem({ productId, quantity: qty });
      setSuccess(true);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "We could not add this item. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cap, disabled, loading, productId, quantity]);

  if (disabled) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        This item is currently unavailable.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`qty-${productId}`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Quantity
          </label>
          <input
            id={`qty-${productId}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={cap}
            value={quantity}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) setQuantity(Math.min(Math.max(1, n), cap));
              else if (e.target.value === "") setQuantity(1);
            }}
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => void onAdd()}
          disabled={loading}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add to cart"}
        </button>
      </div>
      {success ? (
        <p className="text-sm text-foreground" role="status">
          Added to your cart.{" "}
          <Link href="/cart" className="font-medium text-brand hover:underline">
            View cart
          </Link>
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
