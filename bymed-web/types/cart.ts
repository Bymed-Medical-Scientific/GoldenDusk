export type CartItemDto = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CartDto = {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  items: CartItemDto[];
  totalItems: number;
  total: number;
};

export type AddToCartRequest = {
  productId: string;
  quantity?: number;
};
