export interface OrderSummaryDto {
  readonly id: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly status: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly createdAtUtc: string;
}

export interface OrderLineDto {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface OrderDetailDto extends OrderSummaryDto {
  readonly lines: OrderLineDto[];
}
