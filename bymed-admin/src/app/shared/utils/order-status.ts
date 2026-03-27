/** Labels for `Bymed.Domain.Enums.OrderStatus` (numeric JSON from API). */
const ORDER_STATUS_LABELS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

export function orderStatusLabel(status: number): string {
  return ORDER_STATUS_LABELS[status] ?? `Unknown (${status})`;
}

export function orderStatusChipClass(status: number): string {
  return orderStatusLabel(status).toLowerCase();
}
