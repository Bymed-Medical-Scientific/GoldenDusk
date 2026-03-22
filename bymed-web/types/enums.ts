/** Mirrors `Bymed.Domain.Enums` — default API JSON uses numeric enum values unless configured otherwise. */

export enum OrderStatus {
  Pending = 0,
  Processing = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4,
}

export enum PaymentStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Refunded = 3,
}

export enum UserRole {
  Customer = 0,
  Admin = 1,
}
