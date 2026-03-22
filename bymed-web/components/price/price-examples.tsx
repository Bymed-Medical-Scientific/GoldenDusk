"use client";

import { FormattedPrice } from "./formatted-price";

/** Demo strip showing that changing header currency updates all amounts (task 21.3). */
export function PriceExamples() {
  return (
    <p className="mt-6 text-sm text-muted-foreground">
      Example list price:{" "}
      <FormattedPrice
        amount={1299}
        currency="USD"
        className="font-medium text-foreground"
      />
      {" · "}
      Starter item:{" "}
      <FormattedPrice
        amount={49.99}
        currency="USD"
        className="font-medium text-foreground"
      />
    </p>
  );
}
