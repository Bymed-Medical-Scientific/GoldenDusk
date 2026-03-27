/** Labels for `Bymed.Domain.Enums.OrderStatus` (numeric JSON from API). */
const ORDER_STATUS_LABELS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

/**
 * Allowed next statuses from `UpdateOrderStatusCommandHandler.IsValidTransition`
 * (must stay in sync with the backend).
 */
export function allowedNextOrderStatuses(current: number): readonly number[] {
  switch (current) {
    case 0:
      return [1, 4];
    case 1:
      return [2, 4];
    case 2:
      return [3];
    default:
      return [];
  }
}

export function orderStatusLabel(status: number): string {
  return ORDER_STATUS_LABELS[status] ?? `Unknown (${status})`;
}

export function orderStatusChipClass(status: number): string {
  return orderStatusLabel(status).toLowerCase();
}
