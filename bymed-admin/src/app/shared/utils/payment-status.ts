/** Labels for `Bymed.Domain.Enums.PaymentStatus` (numeric JSON from API). */
const PAYMENT_STATUS_LABELS = ['Pending', 'Completed', 'Failed', 'Refunded'] as const;

export function paymentStatusLabel(status: number): string {
  return PAYMENT_STATUS_LABELS[status] ?? `Unknown (${status})`;
}
