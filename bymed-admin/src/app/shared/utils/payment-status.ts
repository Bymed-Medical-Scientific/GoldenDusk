/** Labels for `Bymed.Domain.Enums.PaymentStatus` (numeric or string JSON from API). */
const PAYMENT_STATUS_BY_NAME: Record<string, string> = {
  Pending: "Pending",
  Completed: "Completed",
  Failed: "Failed",
  Refunded: "Refunded",
};

const PAYMENT_STATUS_BY_INDEX = [
  "Pending",
  "Completed",
  "Failed",
  "Refunded",
] as const;

export function paymentStatusLabel(status: number | string): string {
  if (typeof status === "string") {
    return PAYMENT_STATUS_BY_NAME[status] ?? `Unknown (${status})`;
  }
  return PAYMENT_STATUS_BY_INDEX[status] ?? `Unknown (${status})`;
}

export function normalizePaymentStatus(status: number | string): number {
  if (typeof status === "number") {
    return status;
  }
  const index = PAYMENT_STATUS_BY_INDEX.indexOf(status as (typeof PAYMENT_STATUS_BY_INDEX)[number]);
  return index >= 0 ? index : -1;
}
