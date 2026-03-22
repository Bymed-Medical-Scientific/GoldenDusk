"use client";

import { useCurrency } from "@/components/currency/currency-context";

type FormattedPriceProps = {
  /** Catalog / API amount in `currency`. */
  amount: number;
  /** ISO currency code of `amount` (defaults to USD). */
  currency?: string;
  className?: string;
};

function formatSource(amount: number, currencyCode: string): string {
  const code = currencyCode.trim().toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

/**
 * Renders a price in the user’s selected display currency when rates are available
 * (Requirement 15.4); otherwise shows the catalog currency until rates load.
 */
export function FormattedPrice({
  amount,
  currency = "USD",
  className,
}: FormattedPriceProps) {
  const { formatConvertedPrice, rates } = useCurrency();
  const src = currency.trim().toUpperCase();

  const text =
    rates?.rates && rates.baseCurrency
      ? formatConvertedPrice(amount, currency)
      : formatSource(amount, src);

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
