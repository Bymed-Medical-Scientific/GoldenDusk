"use client";

import { FormattedPrice } from "@/components/price/formatted-price";
import { ApiError } from "@/lib/api/http";
import { getOrderById } from "@/lib/api/orders";
import type { OrderDto } from "@/types/order";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderConfirmationPageContentProps = {
  orderId: string;
};

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

export function OrderConfirmationPageContent({ orderId }: OrderConfirmationPageContentProps) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      setError("Missing order id.");
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await getOrderById(orderId);
        if (!mounted) return;
        setOrder(result);
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiError) {
          setError(e.message);
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Unable to load order details.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const currency = useMemo(() => order?.currency ?? "USD", [order?.currency]);

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">Loading order confirmation...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error ?? "Order not found."}
        </div>
        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-brand hover:underline">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
        Order confirmed. Thank you for your purchase.
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Order confirmation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We have received your order and sent a confirmation to <span className="font-medium text-foreground">{order.customerEmail}</span>.
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Order number</dt>
              <dd className="font-medium text-foreground">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Placed on</dt>
              <dd className="font-medium text-foreground">{formatDateTime(order.creationTime)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="font-medium text-foreground">{order.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tracking number</dt>
              <dd className="font-medium text-foreground">{order.trackingNumber?.trim() || "Will be assigned when shipped"}</dd>
            </div>
          </dl>

          <h2 className="mt-6 text-lg font-semibold text-foreground">Items</h2>
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-3 py-3 text-sm">
                <span className="text-foreground">
                  {item.productName} x {item.quantity}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <FormattedPrice amount={item.subtotal} currency={currency} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm lg:h-fit">
          <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums text-foreground">
                <FormattedPrice amount={order.subtotal} currency={currency} />
              </dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>Shipping</dt>
              <dd className="tabular-nums text-foreground">
                <FormattedPrice amount={order.shippingCost} currency={currency} />
              </dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>Tax</dt>
              <dd className="tabular-nums text-foreground">
                <FormattedPrice amount={order.tax} currency={currency} />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
              <dt>Total</dt>
              <dd className="tabular-nums">
                <FormattedPrice amount={order.total} currency={currency} />
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
            >
              Go to order history
            </Link>
            <Link href="/products" className="text-sm font-medium text-brand hover:underline">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
