export type ExchangeRates = {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdated: string;
};

export type CurrencyDetectResponse = {
  currency: string;
};
