"use client";

import {
  SUPPORTED_CURRENCY_CODES,
  SUPPORTED_CURRENCY_LABELS,
  type SupportedCurrencyCode,
} from "@/lib/supported-currencies";
import { useCurrency } from "./currency-context";

type CurrencySelectorProps = {
  /** Header bar: light text on brand. Drawer: dark text on light bg. */
  variant?: "header" | "drawer";
  className?: string;
  selectId?: string;
};

export function CurrencySelector({
  variant = "header",
  className = "",
  selectId,
}: CurrencySelectorProps) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

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
            {variant === "drawer"
              ? SUPPORTED_CURRENCY_LABELS[code]
              : code}
          </option>
        ))}
      </select>
    </div>
  );
}
