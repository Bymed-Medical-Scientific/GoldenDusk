export type CartProductSnapshot = {
  productId: string;
  name: string;
  imageUrl?: string | null;
  currency: string;
  isAvailable: boolean;
};

export type CartViewItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: CartProductSnapshot;
};
