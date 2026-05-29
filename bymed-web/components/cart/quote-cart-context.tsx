"use client";

import type { CartProductSnapshot, CartViewItem } from "@/components/cart/cart-types";
import { getCatalogueItemById } from "@/lib/api/catalogue-items";
import { getProductById } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const GUEST_QUOTE_CART_STORAGE_KEY = "bymed_guest_quote_cart_v1";

type QuoteCartContextValue = {
  items: CartViewItem[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  addItem: (product: CartProductSnapshot, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => void;
  refresh: () => void;
};

const QuoteCartContext = createContext<QuoteCartContextValue | undefined>(undefined);

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong while updating your quote cart.";
}

function readQuoteCart(): CartViewItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_QUOTE_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartViewItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.productId === "string" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeQuoteCart(items: CartViewItem[]): void {
  if (typeof window === "undefined") return;
  if (items.length === 0) {
    window.localStorage.removeItem(GUEST_QUOTE_CART_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(GUEST_QUOTE_CART_STORAGE_KEY, JSON.stringify(items));
}

async function enrichLineItems(items: CartViewItem[]): Promise<CartViewItem[]> {
  const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
  const snapshots = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const product = await getProductById(id);
        return [
          id,
          {
            productId: id,
            name: product.name,
            imageUrl: product.primaryImageUrl ?? null,
            currency: product.currency,
            isAvailable: product.isAvailable,
          } satisfies CartProductSnapshot,
        ] as const;
      } catch {
        try {
          const item = await getCatalogueItemById(id);
          return [
            id,
            {
              productId: id,
              name: item.name,
              imageUrl: item.primaryImageUrl ?? null,
              currency: "USD",
              isAvailable: item.isPublished,
            } satisfies CartProductSnapshot,
          ] as const;
        } catch {
          return [id, undefined] as const;
        }
      }
    }),
  );
  const byId = new Map(snapshots);
  return items.map((item) => ({ ...item, product: byId.get(item.productId) }));
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const stored = readQuoteCart();
    if (stored.length === 0) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    void enrichLineItems(stored)
      .then(setItems)
      .catch((e) => setError(toMessage(e)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== GUEST_QUOTE_CART_STORAGE_KEY) return;
      refresh();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const addItem = useCallback<QuoteCartContextValue["addItem"]>(async (product, quantity) => {
    const safeQty = Math.max(1, Math.floor(quantity));
    setError(null);
    const current = readQuoteCart();
    const next = [...current];
    const existing = next.find((i) => i.productId === product.productId);
    if (existing) {
      existing.quantity += safeQty;
      existing.product = product;
    } else {
      next.push({
        productId: product.productId,
        quantity: safeQty,
        unitPrice: 0,
        lineTotal: 0,
        product,
      });
    }
    writeQuoteCart(next);
    setItems(await enrichLineItems(next));
  }, []);

  const updateQuantity = useCallback<QuoteCartContextValue["updateQuantity"]>(
    async (productId, quantity) => {
      const safeQty = Math.max(1, Math.floor(quantity));
      setError(null);
      const next = readQuoteCart().map((item) =>
        item.productId === productId ? { ...item, quantity: safeQty } : item,
      );
      writeQuoteCart(next);
      setItems(await enrichLineItems(next));
    },
    [],
  );

  const removeItemById = useCallback<QuoteCartContextValue["removeItem"]>(async (productId) => {
    setError(null);
    const next = readQuoteCart().filter((item) => item.productId !== productId);
    writeQuoteCart(next);
    setItems(next.length > 0 ? await enrichLineItems(next) : []);
  }, []);

  const clear = useCallback(() => {
    writeQuoteCart([]);
    setItems([]);
    setError(null);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo<QuoteCartContextValue>(
    () => ({
      items,
      totalItems,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem: removeItemById,
      clear,
      refresh,
    }),
    [items, totalItems, isLoading, error, addItem, removeItemById, clear, refresh, updateQuantity],
  );

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>;
}

export function useQuoteCart(): QuoteCartContextValue {
  const ctx = useContext(QuoteCartContext);
  if (!ctx) throw new Error("useQuoteCart must be used within QuoteCartProvider");
  return ctx;
}
