"use client";

import { useAuth } from "@/components/auth/auth-context";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/api/cart";
import { getProductById } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";
import type { CartDto } from "@/types/cart";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** Used by guest cart and checkout (clear after order). */
export const GUEST_CART_STORAGE_KEY = "bymed_guest_cart_v1";

export type CartProductSnapshot = {
  productId: string;
  name: string;
  imageUrl?: string | null;
  currency: string;
  isAvailable: boolean;
};

export type CartViewItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: CartProductSnapshot;
};

type GuestCartItem = CartViewItem;

type CartContextValue = {
  items: CartViewItem[];
  totalItems: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  addItem: (
    product: CartProductSnapshot,
    quantity: number,
    unitPrice: number,
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong while updating your cart.";
}

function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.productId === "string" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitPrice),
    );
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]): void {
  if (typeof window === "undefined") return;
  if (items.length === 0) {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
}

function calculateTotals(items: CartViewItem[]): { totalItems: number; total: number } {
  return items.reduce(
    (acc, item) => ({
      totalItems: acc.totalItems + item.quantity,
      total: acc.total + item.quantity * item.unitPrice,
    }),
    { totalItems: 0, total: 0 },
  );
}

async function enrichProducts(items: CartViewItem[]): Promise<CartViewItem[]> {
  const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
  const products = await Promise.all(
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
            isAvailable: product.isAvailable && product.inventoryCount > 0,
          } satisfies CartProductSnapshot,
        ] as const;
      } catch {
        return [id, undefined] as const;
      }
    }),
  );
  const byId = new Map(products);
  return items.map((item) => ({ ...item, product: byId.get(item.productId) }));
}

function fromCartDto(cart: CartDto): CartViewItem[] {
  return cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isAuthenticated) {
        setItems(readGuestCart());
        return;
      }

      const guestItems = readGuestCart();
      if (guestItems.length > 0) {
        await Promise.all(
          guestItems.map((item) =>
            addCartItem({ productId: item.productId, quantity: item.quantity }),
          ),
        );
        writeGuestCart([]);
      }

      const cart = await getCart();
      const enriched = await enrichProducts(fromCartDto(cart));
      setItems(enriched);
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== GUEST_CART_STORAGE_KEY) return;
      setItems(readGuestCart());
      setError(null);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isAuthenticated]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    async (product, quantity, unitPrice) => {
      const safeQty = Math.max(1, Math.floor(quantity));
      setError(null);
      try {
        if (!isAuthenticated) {
          const current = readGuestCart();
          const next = [...current];
          const existing = next.find((i) => i.productId === product.productId);
          if (existing) {
            existing.quantity += safeQty;
            existing.lineTotal = existing.quantity * existing.unitPrice;
            existing.product = product;
          } else {
            next.push({
              productId: product.productId,
              quantity: safeQty,
              unitPrice,
              lineTotal: safeQty * unitPrice,
              product,
            });
          }
          writeGuestCart(next);
          setItems(next);
          return;
        }

        const cart = await addCartItem({ productId: product.productId, quantity: safeQty });
        const enriched = await enrichProducts(fromCartDto(cart));
        setItems(enriched);
      } catch (e) {
        setError(toMessage(e));
        throw e;
      }
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    async (productId, quantity) => {
      const safeQty = Math.max(1, Math.floor(quantity));
      setError(null);
      try {
        if (!isAuthenticated) {
          const current = readGuestCart();
          const next = current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: safeQty, lineTotal: safeQty * item.unitPrice }
              : item,
          );
          writeGuestCart(next);
          setItems(next);
          return;
        }

        const cart = await updateCartItemQuantity(productId, safeQty);
        const enriched = await enrichProducts(fromCartDto(cart));
        setItems(enriched);
      } catch (e) {
        setError(toMessage(e));
        throw e;
      }
    },
    [isAuthenticated],
  );

  const removeItemById = useCallback<CartContextValue["removeItem"]>(
    async (productId) => {
      setError(null);
      try {
        if (!isAuthenticated) {
          const next = readGuestCart().filter((item) => item.productId !== productId);
          writeGuestCart(next);
          setItems(next);
          return;
        }

        const cart = await removeCartItem(productId);
        const enriched = await enrichProducts(fromCartDto(cart));
        setItems(enriched);
      } catch (e) {
        setError(toMessage(e));
        throw e;
      }
    },
    [isAuthenticated],
  );

  const totals = useMemo(() => calculateTotals(items), [items]);
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems: totals.totalItems,
      total: totals.total,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem: removeItemById,
      refresh,
    }),
    [items, totals.totalItems, totals.total, isLoading, error, addItem, removeItemById, refresh, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
