"use client";

import { FormattedPrice } from "@/components/price/formatted-price";
import { ApiError } from "@/lib/api/http";
import { getOrderById } from "@/lib/api/orders";
import { OrderStatus, PaymentStatus } from "@/types/enums";
import type { OrderDto } from "@/types/order";
import Link from "next/link";
import { useParams } from "next/navigation";
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

function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Pending:
      return "Pending";
    case OrderStatus.Processing:
      return "Processing";
    case OrderStatus.Shipped:
      return "Shipped";
    case OrderStatus.Delivered:
      return "Delivered";
    case OrderStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Pending:
      return "Pending";
    case PaymentStatus.Completed:
      return "Completed";
    case PaymentStatus.Failed:
      return "Failed";
    case PaymentStatus.Refunded:
      return "Refunded";
    default:
      return "Unknown";
  }
}

function getTrackingText(order: OrderDto): string {
  const trackingNumber = order.trackingNumber?.trim();
  if (!trackingNumber) {
    if (order.status === OrderStatus.Pending || order.status === OrderStatus.Processing) {
      return "Your order is being prepared for shipment.";
    }
    return "Tracking number not assigned yet.";
  }
  if (order.status === OrderStatus.Delivered) {
    return `Delivered. Tracking number: ${trackingNumber}`;
  }
  return `In transit. Tracking number: ${trackingNumber}`;
}

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Order id is missing.");
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);
    void (async () => {
      try {
        const result = await getOrderById(id);
        if (!mounted) return;
        setOrder(result);
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiError || e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load order details.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href="/account/orders" className="text-sm text-brand hover:underline">
        ← Back to order history
      </Link>

      {error ? (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!error && !order ? (
        <p className="mt-4 text-sm text-muted-foreground">Order not found.</p>
      ) : null}

      {order ? (
        <>
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Order {order.orderNumber}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Placed {formatDateTime(order.creationTime)}
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground">
                <FormattedPrice amount={order.total} currency={order.currency} />
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                Order status: {getOrderStatusLabel(order.status)}
              </span>
              <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                Payment status: {getPaymentStatusLabel(order.paymentStatus)}
              </span>
            </div>

            <div className="mt-4 rounded-md border border-border bg-background p-3">
              <p className="text-sm font-medium text-foreground">Tracking</p>
              <p className="mt-1 text-sm text-muted-foreground">{getTrackingText(order)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-foreground">Items</h2>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="text-muted-foreground">
                        <FormattedPrice amount={item.pricePerUnit} currency={order.currency} /> each
                      </p>
                      <p className="font-medium text-foreground">
                        <FormattedPrice amount={item.subtotal} currency={order.currency} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-foreground">Shipping details</h2>
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 ? (
                  <p>{order.shippingAddress.addressLine2}</p>
                ) : null}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
              </div>

              <h3 className="mt-5 text-sm font-semibold text-foreground">Charges</h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>
                    <FormattedPrice amount={order.subtotal} currency={order.currency} />
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>
                    <FormattedPrice amount={order.tax} currency={order.currency} />
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>
                    <FormattedPrice amount={order.shippingCost} currency={order.currency} />
                  </span>
                </p>
                <p className="flex items-center justify-between border-t border-border pt-1 font-semibold text-foreground">
                  <span>Total</span>
                  <span>
                    <FormattedPrice amount={order.total} currency={order.currency} />
                  </span>
                </p>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
