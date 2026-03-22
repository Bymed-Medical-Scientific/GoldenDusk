"use client";

import { detectCurrency, getExchangeRates } from "@/lib/api/currency";
import { convertWithRates } from "@/lib/currency-conversion";
import {
  readStoredCurrency,
  writeStoredCurrency,
} from "@/lib/currency-storage";
import {
  DEFAULT_DISPLAY_CURRENCY,
  isSupportedCurrency,
  type SupportedCurrencyCode,
} from "@/lib/supported-currencies";
import type { ExchangeRates } from "@/types/currency";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CurrencyContextValue = {
  selectedCurrency: SupportedCurrencyCode;
  setSelectedCurrency: (code: SupportedCurrencyCode) => void;
  rates: ExchangeRates | null;
  ratesLoading: boolean;
  /** Convert catalog amount (in `sourceCurrency`) to the selected display currency. */
  convertToSelected: (amount: number, sourceCurrency?: string) => number;
  /** Formatted for the selected display currency (Requirement 15.4). */
  formatConvertedPrice: (amount: number, sourceCurrency?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined,
);

function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] =
    useState<SupportedCurrencyCode>(DEFAULT_DISPLAY_CURRENCY);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredCurrency();
    if (stored) setSelectedCurrencyState(stored);
    else {
      let cancelled = false;
      void detectCurrency()
        .then((d) => {
          if (cancelled) return;
          const c = d.currency?.trim().toUpperCase() ?? "";
          if (isSupportedCurrency(c)) setSelectedCurrencyState(c);
        })
        .catch(() => {
          /* keep default */
        });
      return () => {
        cancelled = true;
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRatesLoading(true);
    void getExchangeRates()
      .then((r) => {
        if (!cancelled) setRates(r);
      })
      .catch(() => {
        if (!cancelled) setRates(null);
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedCurrency = useCallback((code: SupportedCurrencyCode) => {
    setSelectedCurrencyState(code);
    writeStoredCurrency(code);
  }, []);

  const convertToSelected = useCallback(
    (amount: number, sourceCurrency = "USD") => {
      if (!rates?.rates || !rates.baseCurrency) return amount;
      const src = sourceCurrency.trim().toUpperCase();
      return convertWithRates(amount, src, selectedCurrency, rates);
    },
    [rates, selectedCurrency],
  );

  const formatConvertedPrice = useCallback(
    (amount: number, sourceCurrency = "USD") => {
      const n = convertToSelected(amount, sourceCurrency);
      return formatMoney(n, selectedCurrency);
    },
    [convertToSelected, selectedCurrency],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      selectedCurrency,
      setSelectedCurrency,
      rates,
      ratesLoading,
      convertToSelected,
      formatConvertedPrice,
    }),
    [
      selectedCurrency,
      setSelectedCurrency,
      rates,
      ratesLoading,
      convertToSelected,
      formatConvertedPrice,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
