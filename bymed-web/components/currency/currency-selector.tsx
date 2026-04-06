"use client";

import {
  SUPPORTED_CURRENCY_CODES,
  type SupportedCurrencyCode,
} from "@/lib/supported-currencies";
import { useCurrency } from "./currency-context";

function IconCurrency({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

type CurrencySelectorProps = {
  /** Header bar: light text on brand. Drawer: dark text on light bg. headerIcon: icon-only overlay select on brand. surfaceIcon: icon-only on light/glass header. */
  variant?: "header" | "headerIcon" | "headerIconSurface" | "drawer";
  className?: string;
  selectId?: string;
};

export function CurrencySelector({
  variant = "header",
  className = "",
  selectId,
}: CurrencySelectorProps) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  if (variant === "headerIcon" || variant === "headerIconSurface") {
    const surface = variant === "headerIconSurface";
    return (
      <div className={`relative inline-flex h-10 w-10 shrink-0 ${className}`}>
        <label htmlFor={selectId} className="sr-only">
          Currency
        </label>
        <div
          className={
            surface
              ? "pointer-events-none flex h-full w-full items-center justify-center rounded-md border border-border bg-muted/50 text-foreground"
              : "pointer-events-none flex h-full w-full items-center justify-center rounded-md border border-white/25 bg-white/10 text-white"
          }
          aria-hidden
        >
          <IconCurrency />
        </div>
        <select
          id={selectId}
          aria-label="Display currency"
          value={selectedCurrency}
          onChange={(e) =>
            setSelectedCurrency(e.target.value as SupportedCurrencyCode)
          }
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {SUPPORTED_CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const selectClass =
    variant === "header"
      ? "rounded-md border border-white/25 bg-white/10 py-1.5 pl-2 pr-8 text-sm font-medium text-white focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
      : "w-full rounded-md border border-border bg-background py-2 pl-2 pr-8 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className={
          variant === "header"
            ? "sr-only"
            : variant === "drawer"
              ? "sr-only"
              : "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
        }
      >
        Currency
      </label>
      <select
        id={selectId}
        aria-label="Display currency"
        value={selectedCurrency}
        onChange={(e) =>
          setSelectedCurrency(e.target.value as SupportedCurrencyCode)
        }
        className={selectClass}
      >
        {SUPPORTED_CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
