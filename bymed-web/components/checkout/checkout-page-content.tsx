"use client";

import { useAuth } from "@/components/auth/auth-context";
import {
  GUEST_CART_STORAGE_KEY,
  useCart,
  type CartViewItem,
} from "@/components/cart/cart-context";
import { FormattedPrice } from "@/components/price/formatted-price";
import { clearCart } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/http";
import { createOrder } from "@/lib/api/orders";
import { confirmPaymentForOrder, initiatePaymentForOrder } from "@/lib/api/payments";
import { syncGuestCartToServer } from "@/lib/checkout/sync-guest-cart";
import {
  validateContact,
  validateShipping,
  type ContactFormState,
  type ShippingFormState,
} from "@/lib/checkout/validate-checkout";
import { PaymentStatus } from "@/types/enums";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const FALLBACK_CURRENCY = "USD";
const PAYMENT_METHOD_PAYNOW = "PayNow";
const STEPS = ["Shipping", "Contact", "Payment", "Review"] as const;
const MAX_CONFIRM_ATTEMPTS = 3;
const CONFIRM_RETRY_MS = 1200;

type PaymentUiState = "idle" | "initiating" | "confirming" | "success" | "failed";

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function inputClass(hasError: boolean): string {
  return [
    "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm",
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-border focus:border-brand focus:ring-brand",
  ].join(" ");
}

export function CheckoutPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, totalItems, total, isLoading: cartLoading, error: cartError, refresh } = useCart();

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState<ShippingFormState>({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [contact, setContact] = useState<ContactFormState>({
    customerEmail: "",
    customerName: "",
  });
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentUiState>("idle");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setContact((c) => ({
      customerEmail: c.customerEmail || user.email,
      customerName: c.customerName || user.name,
    }));
  }, [user]);

  const currency = useMemo(
    () => items.find((i) => i.product?.currency)?.product?.currency ?? FALLBACK_CURRENCY,
    [items],
  );

  const canCheckout = items.length > 0 && totalItems > 0;

  const confirmPaymentWithRetry = useCallback(async (orderId: string): Promise<void> => {
    setPaymentState("confirming");
    setPaymentMessage("Confirming payment status...");

    for (let attempt = 1; attempt <= MAX_CONFIRM_ATTEMPTS; attempt++) {
      try {
        const result = await confirmPaymentForOrder(orderId);
        if (result.success && result.status === PaymentStatus.Completed) {
          setPaymentState("success");
          setPaymentMessage("Payment confirmed successfully.");
          return;
        }

        if (result.status === PaymentStatus.Pending && attempt < MAX_CONFIRM_ATTEMPTS) {
          await sleep(CONFIRM_RETRY_MS * attempt);
          continue;
        }

        setPaymentState("failed");
        setPaymentMessage(
          result.errorMessage?.trim() ||
            "Payment was not completed. You can retry payment from this page.",
        );
        return;
      } catch (error) {
        if (attempt < MAX_CONFIRM_ATTEMPTS) {
          await sleep(CONFIRM_RETRY_MS * attempt);
          continue;
        }
        setPaymentState("failed");
        if (error instanceof ApiError) {
          setPaymentMessage(error.message);
        } else if (error instanceof Error) {
          setPaymentMessage(error.message);
        } else {
          setPaymentMessage("Failed to confirm payment status.");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    const paymentReturned = params.get("payment") === "returned";
    if (!orderId || !paymentReturned) return;
    void confirmPaymentWithRetry(orderId);
  }, [confirmPaymentWithRetry]);

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function goNext() {
    setSubmitError(null);
    if (step === 0) {
      const e = validateShipping(shipping);
      setFieldErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    if (step === 1) {
      const e = validateContact(contact);
      setFieldErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function placeOrder() {
    setSubmitError(null);
    setIsSubmitting(true);
    setPaymentState("idle");
    setPaymentMessage(null);
    try {
      if (!canCheckout) {
        setSubmitError("Your cart is empty.");
        return;
      }

      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (!isAuthenticated) {
        await syncGuestCartToServer(items);
      }

      const order = await createOrder({
        idempotencyKey,
        customerEmail: contact.customerEmail.trim(),
        customerName: contact.customerName.trim(),
        shippingAddress: {
          name: shipping.name.trim(),
          addressLine1: shipping.addressLine1.trim(),
          addressLine2: shipping.addressLine2.trim() || null,
          city: shipping.city.trim(),
          state: shipping.state.trim(),
          postalCode: shipping.postalCode.trim(),
          country: shipping.country.trim(),
          phone: shipping.phone.trim(),
        },
        paymentMethod: PAYMENT_METHOD_PAYNOW,
        notes: notes.trim() || null,
        tax: 0,
        shippingCost: 0,
      });

      try {
        await clearCart();
      } catch {
        /* order exists; cart clear is best-effort */
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }
      await refresh();
      setLastOrderId(order.id);

      setPaymentState("initiating");
      setPaymentMessage("Starting secure PayNow checkout...");
      const payment = await initiatePaymentForOrder(order.id);
      if (payment.success && payment.redirectUrl) {
        window.location.assign(payment.redirectUrl);
        return;
      }

      setPaymentState("failed");
      setSubmitError(
        payment.errorMessage?.trim() ||
          "Payment could not be started. Your order was created; you can retry payment from your account or contact support.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.validationIssues?.length) {
          setSubmitError(err.validationIssues.map((i) => i.errorMessage).join(" "));
        } else {
          setSubmitError(err.message);
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Checkout failed. Please try again.");
      }
      setPaymentState("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function retryPayment(): Promise<void> {
    if (!lastOrderId) return;
    setSubmitError(null);
    setPaymentState("initiating");
    setPaymentMessage("Retrying PayNow checkout...");
    try {
      const payment = await initiatePaymentForOrder(lastOrderId);
      if (payment.success && payment.redirectUrl) {
        window.location.assign(payment.redirectUrl);
        return;
      }

      setPaymentState("failed");
      setPaymentMessage(
        payment.errorMessage?.trim() || "Retry failed. Please try again in a moment.",
      );
    } catch (error) {
      setPaymentState("failed");
      if (error instanceof ApiError) {
        setPaymentMessage(error.message);
      } else if (error instanceof Error) {
        setPaymentMessage(error.message);
      } else {
        setPaymentMessage("Retry failed.");
      }
    }
  }

  if (authLoading || cartLoading) {
    return <p className="text-muted-foreground">Loading checkout…</p>;
  }

  if (!canCheckout) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Your cart is empty. Add products before checkout.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <nav aria-label="Checkout steps" className="mb-8">
          <ol className="flex flex-wrap gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                {i > 0 ? <span className="text-muted-foreground" aria-hidden>/</span> : null}
                <span
                  className={
                    i === step
                      ? "font-semibold text-brand"
                      : i < step
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70"
                  }
                >
                  {i + 1}. {label}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        {cartError ? (
          <p
            role="alert"
            className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            {cartError}
          </p>
        ) : null}

        {submitError ? (
          <p
            role="alert"
            className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            {submitError}
          </p>
        ) : null}
        {paymentMessage ? (
          <p
            role="status"
            className={
              paymentState === "success"
                ? "mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300"
                : paymentState === "failed"
                  ? "mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  : "mb-4 rounded-md border border-brand/30 bg-brand/5 px-3 py-2 text-sm text-foreground"
            }
          >
            {paymentMessage}
          </p>
        ) : null}

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Shipping address</h2>
            <div>
              <label htmlFor="ship-name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="ship-name"
                autoComplete="shipping name"
                value={shipping.name}
                onChange={(ev) => {
                  setShipping((s) => ({ ...s, name: ev.target.value }));
                  clearFieldError("name");
                }}
                className={inputClass(!!fieldErrors.name)}
              />
              <FieldError message={fieldErrors.name} />
            </div>
            <div>
              <label htmlFor="ship-line1" className="text-sm font-medium text-foreground">
                Address line 1
              </label>
              <input
                id="ship-line1"
                autoComplete="address-line1"
                value={shipping.addressLine1}
                onChange={(ev) => {
                  setShipping((s) => ({ ...s, addressLine1: ev.target.value }));
                  clearFieldError("addressLine1");
                }}
                className={inputClass(!!fieldErrors.addressLine1)}
              />
              <FieldError message={fieldErrors.addressLine1} />
            </div>
            <div>
              <label htmlFor="ship-line2" className="text-sm font-medium text-foreground">
                Address line 2 <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="ship-line2"
                autoComplete="address-line2"
                value={shipping.addressLine2}
                onChange={(ev) => {
                  setShipping((s) => ({ ...s, addressLine2: ev.target.value }));
                  clearFieldError("addressLine2");
                }}
                className={inputClass(!!fieldErrors.addressLine2)}
              />
              <FieldError message={fieldErrors.addressLine2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ship-city" className="text-sm font-medium text-foreground">
                  City
                </label>
                <input
                  id="ship-city"
                  autoComplete="address-level2"
                  value={shipping.city}
                  onChange={(ev) => {
                    setShipping((s) => ({ ...s, city: ev.target.value }));
                    clearFieldError("city");
                  }}
                  className={inputClass(!!fieldErrors.city)}
                />
                <FieldError message={fieldErrors.city} />
              </div>
              <div>
                <label htmlFor="ship-state" className="text-sm font-medium text-foreground">
                  State / region
                </label>
                <input
                  id="ship-state"
                  autoComplete="address-level1"
                  value={shipping.state}
                  onChange={(ev) => {
                    setShipping((s) => ({ ...s, state: ev.target.value }));
                    clearFieldError("state");
                  }}
                  className={inputClass(!!fieldErrors.state)}
                />
                <FieldError message={fieldErrors.state} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ship-postal" className="text-sm font-medium text-foreground">
                  Postal code
                </label>
                <input
                  id="ship-postal"
                  autoComplete="postal-code"
                  value={shipping.postalCode}
                  onChange={(ev) => {
                    setShipping((s) => ({ ...s, postalCode: ev.target.value }));
                    clearFieldError("postalCode");
                  }}
                  className={inputClass(!!fieldErrors.postalCode)}
                />
                <FieldError message={fieldErrors.postalCode} />
              </div>
              <div>
                <label htmlFor="ship-country" className="text-sm font-medium text-foreground">
                  Country
                </label>
                <input
                  id="ship-country"
                  autoComplete="country-name"
                  value={shipping.country}
                  onChange={(ev) => {
                    setShipping((s) => ({ ...s, country: ev.target.value }));
                    clearFieldError("country");
                  }}
                  className={inputClass(!!fieldErrors.country)}
                />
                <FieldError message={fieldErrors.country} />
              </div>
            </div>
            <div>
              <label htmlFor="ship-phone" className="text-sm font-medium text-foreground">
                Phone
              </label>
              <input
                id="ship-phone"
                type="tel"
                autoComplete="tel"
                value={shipping.phone}
                onChange={(ev) => {
                  setShipping((s) => ({ ...s, phone: ev.target.value }));
                  clearFieldError("phone");
                }}
                className={inputClass(!!fieldErrors.phone)}
              />
              <FieldError message={fieldErrors.phone} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Contact information</h2>
            <div>
              <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                value={contact.customerEmail}
                onChange={(ev) => {
                  setContact((c) => ({ ...c, customerEmail: ev.target.value }));
                  clearFieldError("customerEmail");
                }}
                className={inputClass(!!fieldErrors.customerEmail)}
              />
              <FieldError message={fieldErrors.customerEmail} />
            </div>
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                Name on order
              </label>
              <input
                id="contact-name"
                autoComplete="name"
                value={contact.customerName}
                onChange={(ev) => {
                  setContact((c) => ({ ...c, customerName: ev.target.value }));
                  clearFieldError("customerName");
                }}
                className={inputClass(!!fieldErrors.customerName)}
              />
              <FieldError message={fieldErrors.customerName} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Payment</h2>
            <p className="text-sm text-muted-foreground">
              Pay securely with PayNow. You will be redirected to complete payment; card and bank details are handled
              only on PayNow over HTTPS.
            </p>
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
              <span className="font-medium">Payment method:</span> PayNow
            </div>
            <div>
              <label htmlFor="order-notes" className="text-sm font-medium text-foreground">
                Order notes <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="order-notes"
                rows={3}
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand focus:ring-brand"
                maxLength={500}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Review your order</h2>
            <section>
              <h3 className="text-sm font-semibold text-foreground">Ship to</h3>
              <address className="mt-1 not-italic text-sm text-muted-foreground">
                {shipping.name.trim()}
                <br />
                {shipping.addressLine1.trim()}
                {shipping.addressLine2.trim() ? (
                  <>
                    <br />
                    {shipping.addressLine2.trim()}
                  </>
                ) : null}
                <br />
                {shipping.city.trim()}, {shipping.state.trim()} {shipping.postalCode.trim()}
                <br />
                {shipping.country.trim()}
                <br />
                {shipping.phone.trim()}
              </address>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-foreground">Contact</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {contact.customerName.trim()} · {contact.customerEmail.trim()}
              </p>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-foreground">Payment</h3>
              <p className="mt-1 text-sm text-muted-foreground">PayNow (redirect after you confirm)</p>
            </section>
            {notes.trim() ? (
              <section>
                <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{notes.trim()}</p>
              </section>
            ) : null}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={isSubmitting}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={isSubmitting || paymentState === "confirming"}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
            >
              {isSubmitting || paymentState === "initiating" || paymentState === "confirming"
                ? "Processing…"
                : "Place order and pay"}
            </button>
          )}
          {paymentState === "failed" && lastOrderId ? (
            <button
              type="button"
              onClick={() => void retryPayment()}
              disabled={isSubmitting}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Retry payment
            </button>
          ) : null}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto text-sm">
            {items.map((line) => (
              <CheckoutLine key={line.productId} line={line} currency={currency} />
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums text-foreground">
                <FormattedPrice amount={total} currency={currency} />
              </dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Shipping</dt>
              <dd className="tabular-nums text-foreground">
                <FormattedPrice amount={0} currency={currency} />
              </dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Tax</dt>
              <dd className="tabular-nums text-foreground">
                <FormattedPrice amount={0} currency={currency} />
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
              <dt>Total</dt>
              <dd className="tabular-nums">
                <FormattedPrice amount={total} currency={currency} />
              </dd>
            </div>
          </dl>
          <Link
            href="/cart"
            className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
          >
            Edit cart
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CheckoutLine({ line, currency }: { line: CartViewItem; currency: string }) {
  const title = line.product?.name ?? "Product";
  return (
    <li className="flex justify-between gap-2">
      <span className="text-foreground">
        {title} × {line.quantity}
      </span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        <FormattedPrice amount={line.quantity * line.unitPrice} currency={currency} />
      </span>
    </li>
  );
}
