import { convertWithRates } from "./currency-conversion";

describe("convertWithRates (USD base, same as backend CurrencyService)", () => {
  const rates = {
    baseCurrency: "USD",
    lastUpdated: "2025-01-01T00:00:00.000Z",
    rates: { USD: 1, ZAR: 18, KES: 150, NGN: 1500 },
  };

  it("converts via USD pivot", () => {
    expect(convertWithRates(18, "ZAR", "USD", rates)).toBeCloseTo(1, 5);
    expect(convertWithRates(1, "USD", "ZAR", rates)).toBeCloseTo(18, 5);
    expect(convertWithRates(150, "KES", "NGN", rates)).toBeCloseTo(1500, 5);
  });

  it("is identity when currencies match", () => {
    expect(convertWithRates(42.5, "ZAR", "ZAR", rates)).toBe(42.5);
  });
});
