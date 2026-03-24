"use client";

import { FormattedPrice } from "@/components/price/formatted-price";
import { ApiError } from "@/lib/api/http";
import { listMyOrders } from "@/lib/api/orders";
import type { OrderDto } from "@/types/order";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatDateTime(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await listMyOrders({ pageNumber: 1, pageSize: 20 });
        if (!mounted) return;
        setOrders(result.items);
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiError) {
          setError(e.message);
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load order history.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Order history</h1>
      <p className="mt-2 text-sm text-muted-foreground">Review your recent orders and totals.</p>

      {isLoading ? <p className="mt-6 text-muted-foreground">Loading orders...</p> : null}

      {error ? (
        <p className="mt-6 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && orders.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
          <Link href="/products" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
            Browse products
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && orders.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{formatDateTime(order.creationTime)}</p>
                <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{order.items.length} item(s)</p>
                <p className="text-sm font-semibold text-foreground">
                  <FormattedPrice amount={order.total} currency={order.currency} />
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tracking: {order.trackingNumber?.trim() || "Not assigned"}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
