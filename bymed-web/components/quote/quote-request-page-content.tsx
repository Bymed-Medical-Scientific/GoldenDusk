"use client";

import { GUEST_QUOTE_CART_STORAGE_KEY, useQuoteCart } from "@/components/cart/quote-cart-context";
import type { CartViewItem } from "@/components/cart/cart-types";
import { submitQuoteRequest } from "@/lib/api/quotes";
import { ApiError } from "@/lib/api/http";
import Link from "next/link";
import { useEffect, useState } from "react";

const STEPS = ["Contact", "Review"] as const;
const TOAST_DISMISS_MS = 5000;

type ToastState = {
  kind: "success" | "error";
  message: string;
};

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

export function QuoteRequestPageContent() {
  const { items, totalItems, isLoading: cartLoading, error: cartError, clear, refresh } = useQuoteCart();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const canSubmit = items.length > 0 && totalItems > 0;

  useEffect(() => {
    if (!toast || typeof window === "undefined") {
      return;
    }

    const handle = window.setTimeout(() => setToast(null), TOAST_DISMISS_MS);
    return () => window.clearTimeout(handle);
  }, [toast]);

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
      const e: Record<string, string> = {};
      if (!fullName.trim()) e.fullName = "Full name is required.";
      if (!institution.trim()) e.institution = "Institution is required.";
      if (!email.trim()) e.email = "Email is required.";
      if (!phoneNumber.trim()) e.phoneNumber = "Phone number is required.";
      if (!address.trim()) e.address = "Address is required.";
      setFieldErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submitRfq() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (!canSubmit) {
        const message = "Your quote cart is empty.";
        setSubmitError(message);
        setToast({ kind: "error", message });
        return;
      }

      await submitQuoteRequest({
        fullName: fullName.trim(),
        institution: institution.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        notes: notes.trim(),
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });

      setToast({ kind: "success", message: "Quote request submitted successfully." });
      setFullName("");
      setInstitution("");
      setEmail("");
      setPhoneNumber("");
      setAddress("");
      setNotes("");
      setFieldErrors({});
      setStep(0);
      clear();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUEST_QUOTE_CART_STORAGE_KEY);
      }
      refresh();
    } catch (err) {
      let message = "Quote request failed. Please try again.";
      if (err instanceof ApiError) {
        if (err.validationIssues?.length) {
          message = err.validationIssues.map((i) => i.errorMessage).join(" ");
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setSubmitError(message);
      setToast({ kind: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const toastBanner = toast ? (
    <p
      role="status"
      aria-live="polite"
      className={[
        "mb-4 rounded-md border px-3 py-2 text-sm",
        toast.kind === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-red-300 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
      ].join(" ")}
    >
      {toast.message}
    </p>
  ) : null;

  if (cartLoading) {
    return (
      <>
        {toastBanner}
        <p className="text-muted-foreground">Loading quote request…</p>
      </>
    );
  }

  if (!canSubmit) {
    return (
      <>
        {toastBanner}
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">
            Your quote cart is empty. Add catalogue items or products to request a quotation.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
            >
              Browse catalogue
            </Link>
            <Link
              href="/products"
              className="inline-flex rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Browse products
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {toastBanner}
        <nav aria-label="Quote request steps" className="mb-8">
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
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Quotation contact details</h2>
            <div>
              <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="full-name"
                autoComplete="name"
                value={fullName}
                onChange={(ev) => {
                  setFullName(ev.target.value);
                  clearFieldError("fullName");
                }}
                className={inputClass(!!fieldErrors.fullName)}
              />
              <FieldError message={fieldErrors.fullName} />
            </div>
            <div>
              <label htmlFor="institution" className="text-sm font-medium text-foreground">
                Institution
              </label>
              <input
                id="institution"
                value={institution}
                onChange={(ev) => {
                  setInstitution(ev.target.value);
                  clearFieldError("institution");
                }}
                className={inputClass(!!fieldErrors.institution)}
              />
              <FieldError message={fieldErrors.institution} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => {
                    setEmail(ev.target.value);
                    clearFieldError("email");
                  }}
                  className={inputClass(!!fieldErrors.email)}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <label htmlFor="phone-number" className="text-sm font-medium text-foreground">
                  Phone number
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(ev) => {
                    setPhoneNumber(ev.target.value);
                    clearFieldError("phoneNumber");
                  }}
                  className={inputClass(!!fieldErrors.phoneNumber)}
                />
                <FieldError message={fieldErrors.phoneNumber} />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="text-sm font-medium text-foreground">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(ev) => {
                  setAddress(ev.target.value);
                  clearFieldError("address");
                }}
                className={inputClass(!!fieldErrors.address)}
              />
              <FieldError message={fieldErrors.address} />
            </div>
            <div>
              <label htmlFor="order-notes" className="text-sm font-medium text-foreground">
                Extra notes <span className="font-normal text-muted-foreground">(optional)</span>
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

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Review quote request</h2>
            <section>
              <h3 className="text-sm font-semibold text-foreground">Requester</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {fullName.trim()} · {institution.trim()} · {email.trim()} · {phoneNumber.trim()}
              </p>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-foreground">Address</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{address.trim()}</p>
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
          {step < 1 ? (
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
              onClick={() => void submitRfq()}
              disabled={isSubmitting}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit quote request"}
            </button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Quote summary</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto text-sm">
            {items.map((line) => (
              <QuoteLine key={line.productId} line={line} />
            ))}
          </ul>
          <Link
            href="/quote-cart"
            className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
          >
            Edit quote cart
          </Link>
        </div>
      </aside>
    </div>
  );
}

function QuoteLine({ line }: { line: CartViewItem }) {
  const title = line.product?.name ?? "Item";
  return (
    <li className="flex justify-between gap-2">
      <span className="text-foreground">
        {title} × {line.quantity}
      </span>
    </li>
  );
}
