"use client";

import { FormattedPrice } from "./formatted-price";

const SAMPLES = [
  { name: "Example patient monitor", price: 899, currency: "USD" as const },
  { name: "Examination consumables kit", price: 124.5, currency: "USD" as const },
];

export function ProductPriceSamples() {
  return (
    <ul className="mt-6 divide-y divide-border border border-border rounded-lg">
      {SAMPLES.map((p) => (
        <li
          key={p.name}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
        >
          <span className="text-foreground">{p.name}</span>
          <FormattedPrice
            amount={p.price}
            currency={p.currency}
            className="font-medium tabular-nums text-foreground"
          />
        </li>
      ))}
    </ul>
  );
}
