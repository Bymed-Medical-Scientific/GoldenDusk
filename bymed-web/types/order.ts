import type { OrderStatus, PaymentStatus } from "./enums";

export type ShippingAddressDto = {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type OrderItemDto = {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  idempotencyKey?: string | null;
  userId?: string | null;
  status: OrderStatus;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddressDto;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  currency: string;
  exchangeRate: number;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  paymentMethod: string;
  trackingNumber?: string | null;
  notes?: string | null;
  items: OrderItemDto[];
  creationTime: string;
  creatorId?: string | null;
  lastModificationTime?: string | null;
  lastModifierUserId?: string | null;
};

export type CreateOrderRequest = {
  idempotencyKey: string;
  userId?: string | null;
  sessionId?: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddressDto;
  paymentMethod: string;
  notes?: string | null;
  tax?: number;
  shippingCost?: number;
};

export type UpdateOrderStatusRequest = {
  status: OrderStatus;
  trackingNumber?: string | null;
  notes?: string | null;
};

export type SalesByDayPoint = {
  date: string;
  revenue: number;
  orderCount: number;
};

export type TopProductRow = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

/** `countByStatus` keys are numeric order status values as strings when serialized from .NET. */
export type OrderAnalyticsResult = {
  totalOrderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  countByStatus: Record<string, number>;
  revenueByDay: SalesByDayPoint[];
  topProducts: TopProductRow[];
};
