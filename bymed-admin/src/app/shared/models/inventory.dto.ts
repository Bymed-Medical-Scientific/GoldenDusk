export interface AdjustInventoryRequestDto {
  readonly adjustment: number;
  readonly reason: string;
}

/** Mirrors API `InventoryDto` (camelCase JSON). */
export interface InventoryItemDto {
  readonly productId: string;
  readonly productName: string;
  readonly sku?: string | null;
  readonly inventoryCount: number;
  readonly lowStockThreshold: number;
  readonly isAvailable: boolean;
  readonly isLowStock: boolean;
}
