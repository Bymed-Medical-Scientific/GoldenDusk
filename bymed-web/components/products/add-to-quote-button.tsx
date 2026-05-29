"use client";

import { useQuoteCart } from "@/components/cart/quote-cart-context";
import { ApiError } from "@/lib/api/http";
import Link from "next/link";
import { useCallback, useState } from "react";

type AddToQuoteButtonProps = {
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  disabled: boolean;
};

export function AddToQuoteButton({
  productId,
  productName,
  productImageUrl,
  disabled,
}: AddToQuoteButtonProps) {
  const { addItem } = useQuoteCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cap = 99;

  const onAdd = useCallback(async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const qty = Math.min(Math.max(1, quantity), cap);
      await addItem(
        {
          productId,
          name: productName,
          imageUrl: productImageUrl ?? null,
          currency: "USD",
          isAvailable: true,
        },
        qty,
      );
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
  }, [addItem, cap, disabled, loading, productId, productImageUrl, productName, quantity]);

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
            htmlFor={`quote-qty-${productId}`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Quantity
          </label>
          <input
            id={`quote-qty-${productId}`}
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
          className="rounded-md border border-brand bg-background px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add to quote"}
        </button>
      </div>
      {success ? (
        <p className="text-sm text-foreground" role="status">
          Added to your quote cart.{" "}
          <Link href="/quote-cart" className="font-medium text-brand hover:underline">
            View quote cart
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
