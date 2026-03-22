export type InventoryDto = {
  productId: string;
  productName: string;
  sku?: string | null;
  inventoryCount: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isLowStock: boolean;
};

export type InventoryLogDto = {
  id: string;
  productId: string;
  previousCount: number;
  newCount: number;
  changeAmount: number;
  reason: string;
  changedBy: string;
  createdAt: string;
};

export type AdjustInventoryRequest = {
  adjustment: number;
  reason: string;
};
