"use client";

import { useCart } from "@/components/cart/cart-context";
import { useQuoteCart } from "@/components/cart/quote-cart-context";
import { FormattedPrice } from "@/components/price/formatted-price";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

const FALLBACK_CURRENCY = "USD";
const PREVIEW_LIMIT = 4;

function IconCart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

type HeaderCartMenuProps = {
  iconBtnClass: string;
  className?: string;
};

export function HeaderCartMenu({ iconBtnClass, className }: HeaderCartMenuProps) {
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"shopping" | "quote">("shopping");

  const {
    items: shopItems,
    totalItems: shopCount,
    total: shopTotal,
    isLoading: shopLoading,
  } = useCart();
  const {
    items: quoteItems,
    totalItems: quoteCount,
    isLoading: quoteLoading,
  } = useQuoteCart();

  const combinedCount = shopCount + quoteCount;
  const shopCurrency = useMemo(
    () => shopItems.find((i) => i.product?.currency)?.product?.currency ?? FALLBACK_CURRENCY,
    [shopItems],
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className={cn("relative hidden lg:block", className)}>
      <button
        type="button"
        className={iconBtnClass}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          combinedCount > 0
            ? `Cart, ${combinedCount} items`
            : "Cart, empty"
        }
        onClick={() =>
          setOpen((wasOpen) => {
            if (!wasOpen) {
              if (shopCount > 0) setTab("shopping");
              else if (quoteCount > 0) setTab("quote");
              else setTab("shopping");
            }
            return !wasOpen;
          })
        }
      >
        <IconCart />
        {combinedCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold leading-none text-brand-foreground">
            {combinedCount > 99 ? "99+" : combinedCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Cart"
          className="absolute right-0 top-full z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-premium"
        >
          <div
            className="flex border-b border-border"
            role="tablist"
            aria-label="Cart type"
          >
            <TabButton
              active={tab === "shopping"}
              label="Shopping"
              count={shopCount}
              onClick={() => setTab("shopping")}
            />
            <TabButton
              active={tab === "quote"}
              label="Quote"
              count={quoteCount}
              onClick={() => setTab("quote")}
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-3">
            {tab === "shopping" ? (
              <ShoppingPanel
                items={shopItems}
                isLoading={shopLoading}
                total={shopTotal}
                currency={shopCurrency}
                onNavigate={close}
              />
            ) : (
              <QuotePanel
                items={quoteItems}
                isLoading={quoteLoading}
                onNavigate={close}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-b-2 border-brand bg-brand/5 text-brand"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {label}
      {count > 0 ? (
        <span
          className={cn(
            "inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums",
            active
              ? "bg-brand text-brand-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}

function ShoppingPanel({
  items,
  isLoading,
  total,
  currency,
  onNavigate,
}: {
  items: ReturnType<typeof useCart>["items"];
  isLoading: boolean;
  total: number;
  currency: string;
  onNavigate: () => void;
}) {
  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        message="Your shopping cart is empty."
        browseHref="/products"
        browseLabel="Browse products"
      />
    );
  }

  const preview = items.slice(0, PREVIEW_LIMIT);
  const remaining = items.length - preview.length;

  return (
    <>
      <ul className="space-y-2">
        {preview.map((line) => (
          <li
            key={line.productId}
            className="flex items-start justify-between gap-2 text-sm"
          >
            <span className="min-w-0 text-foreground">
              <span className="line-clamp-2">{line.product?.name ?? "Product"}</span>
              <span className="text-muted-foreground"> × {line.quantity}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <FormattedPrice amount={line.quantity * line.unitPrice} currency={currency} />
            </span>
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">+ {remaining} more item(s)</p>
      ) : null}
      <dl className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <dt className="font-medium text-foreground">Subtotal</dt>
        <dd className="font-semibold tabular-nums text-foreground">
          <FormattedPrice amount={total} currency={currency} />
        </dd>
      </dl>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/cart"
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          View cart
        </Link>
        <Link
          href="/checkout"
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
        >
          Checkout
        </Link>
      </div>
    </>
  );
}

function QuotePanel({
  items,
  isLoading,
  onNavigate,
}: {
  items: ReturnType<typeof useQuoteCart>["items"];
  isLoading: boolean;
  onNavigate: () => void;
}) {
  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        message="Your quote cart is empty."
        browseHref="/catalogue"
        browseLabel="Browse catalogue"
      />
    );
  }

  const preview = items.slice(0, PREVIEW_LIMIT);
  const remaining = items.length - preview.length;

  return (
    <>
      <ul className="space-y-2">
        {preview.map((line) => (
          <li key={line.productId} className="text-sm text-foreground">
            <span className="line-clamp-2">{line.product?.name ?? "Item"}</span>
            <span className="text-muted-foreground"> × {line.quantity}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">+ {remaining} more item(s)</p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">
        Pricing will be confirmed after you submit your quote request.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/quote-cart"
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          View quote cart
        </Link>
        <Link
          href="/quote"
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
        >
          Request quotation
        </Link>
      </div>
    </>
  );
}

function EmptyState({
  message,
  browseHref,
  browseLabel,
}: {
  message: string;
  browseHref: string;
  browseLabel: string;
}) {
  return (
    <div className="py-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        href={browseHref}
        className="mt-3 inline-flex text-sm font-medium text-brand hover:underline"
      >
        {browseLabel}
      </Link>
    </div>
  );
}

/** Grouped cart links for the mobile drawer footer. */
export function MobileCartLinks({
  shopCount,
  quoteCount,
  onNavigate,
}: {
  shopCount: number;
  quoteCount: number;
  onNavigate?: () => void;
}) {
  const combined = shopCount + quoteCount;
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Cart{combined > 0 ? ` (${combined})` : ""}
      </p>
      <Link
        href="/cart"
        onClick={onNavigate}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Shopping{shopCount > 0 ? ` · ${shopCount} item${shopCount === 1 ? "" : "s"}` : ""}
      </Link>
      <Link
        href="/quote-cart"
        onClick={onNavigate}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Quote{quoteCount > 0 ? ` · ${quoteCount} item${quoteCount === 1 ? "" : "s"}` : ""}
      </Link>
    </div>
  );
}
