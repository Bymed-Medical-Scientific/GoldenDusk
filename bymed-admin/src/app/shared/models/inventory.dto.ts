export interface InventoryItemDto {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly currentStock: number;
  readonly lowStockThreshold: number;
}
