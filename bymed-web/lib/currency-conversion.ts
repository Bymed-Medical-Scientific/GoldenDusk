import type { ExchangeRates } from "@/types/currency";

/**
 * Converts `amount` from `fromCurrency` to `toCurrency` using the same USD-base
 * semantics as `CurrencyService.ConvertWithRates` (Bymed.Infrastructure).
 */
export function convertWithRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): number {
  const from = fromCurrency.trim().toUpperCase();
  const to = toCurrency.trim().toUpperCase();
  if (from === to) return amount;

  const base = rates.baseCurrency.trim().toUpperCase();
  const map = rates.rates;

  const toBase = (amt: number, code: string): number => {
    if (code === base) return amt;
    const r = map[code];
    if (r == null || r === 0) return amt;
    return amt / r;
  };

  const fromBase = (baseAmt: number, code: string): number => {
    if (code === base) return baseAmt;
    const r = map[code];
    if (r == null) return baseAmt;
    return baseAmt * r;
  };

  const inBase = toBase(amount, from);
  return fromBase(inBase, to);
}
