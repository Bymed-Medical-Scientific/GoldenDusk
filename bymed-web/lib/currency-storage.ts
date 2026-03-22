import { isSupportedCurrency, type SupportedCurrencyCode } from "./supported-currencies";

const STORAGE_KEY = "bymed.selectedCurrency";

export function readStoredCurrency(): SupportedCurrencyCode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)?.trim().toUpperCase();
    if (raw && isSupportedCurrency(raw)) return raw;
  } catch {
    /* private mode / blocked */
  }
  return null;
}

export function writeStoredCurrency(code: SupportedCurrencyCode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}
