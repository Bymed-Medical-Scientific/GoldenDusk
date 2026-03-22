/** Requirement 15.1 — minimum supported storefront currencies. */
export const SUPPORTED_CURRENCY_CODES = ["USD", "ZAR", "KES", "NGN"] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

export const SUPPORTED_CURRENCY_LABELS: Record<SupportedCurrencyCode, string> = {
  USD: "US dollar (USD)",
  ZAR: "South African rand (ZAR)",
  KES: "Kenyan shilling (KES)",
  NGN: "Nigerian naira (NGN)",
};

export function isSupportedCurrency(code: string): code is SupportedCurrencyCode {
  return (SUPPORTED_CURRENCY_CODES as readonly string[]).includes(code);
}

export const DEFAULT_DISPLAY_CURRENCY: SupportedCurrencyCode = "USD";
