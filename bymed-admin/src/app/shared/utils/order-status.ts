/** Labels for `Bymed.Domain.Enums.OrderStatus` (numeric or string JSON from API). */
const ORDER_STATUS_BY_NAME: Record<string, string> = {
  Pending: "Pending",
  Processing: "Processing",
  Shipped: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

const ORDER_STATUS_BY_INDEX = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

/**
 * Allowed next statuses from `UpdateOrderStatusCommandHandler.IsValidTransition`
 * (must stay in sync with the backend).
 */
export function allowedNextOrderStatuses(current: number | string): readonly number[] {
  const normalized = normalizeOrderStatus(current);
  switch (normalized) {
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

export function orderStatusLabel(status: number | string): string {
  if (typeof status === "string") {
    return ORDER_STATUS_BY_NAME[status] ?? `Unknown (${status})`;
  }
  return ORDER_STATUS_BY_INDEX[status] ?? `Unknown (${status})`;
}

export function orderStatusChipClass(status: number | string): string {
  return orderStatusLabel(status).toLowerCase();
}

export function normalizeOrderStatus(status: number | string): number {
  if (typeof status === "number") {
    return status;
  }
  const index = ORDER_STATUS_BY_INDEX.indexOf(status as (typeof ORDER_STATUS_BY_INDEX)[number]);
  return index >= 0 ? index : -1;
}
