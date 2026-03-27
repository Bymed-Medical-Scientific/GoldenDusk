/** Mirrors API `OrderDto` (camelCase JSON). */
export interface ShippingAddressDto {
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2?: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly phone: string;
}

export interface OrderItemDto {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly productImageUrl: string;
  readonly quantity: number;
  readonly pricePerUnit: number;
  readonly subtotal: number;
}

/** Full order row returned by list and detail endpoints. */
export interface OrderDto {
  readonly id: string;
  readonly orderNumber: string;
  readonly idempotencyKey?: string | null;
  readonly userId?: string | null;
  /** Numeric `OrderStatus` enum value from API. */
  readonly status: number;
  readonly customerEmail: string;
  readonly customerName: string;
  readonly shippingAddress: ShippingAddressDto;
  readonly subtotal: number;
  readonly tax: number;
  readonly shippingCost: number;
  readonly total: number;
  readonly currency: string;
  readonly exchangeRate: number;
  /** Numeric `PaymentStatus` enum value from API. */
  readonly paymentStatus: number;
  readonly paymentReference: string;
  readonly paymentMethod: string;
  readonly trackingNumber?: string | null;
  readonly notes?: string | null;
  readonly items: OrderItemDto[];
  readonly creationTime: string;
  readonly creatorId?: string | null;
  readonly lastModificationTime?: string | null;
  readonly lastModifierUserId?: string | null;
}

/** Alias for list widgets (same shape as `OrderDto`). */
export type OrderSummaryDto = OrderDto;

export type OrderDetailDto = OrderDto;
