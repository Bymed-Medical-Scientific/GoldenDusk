export interface ProductDto {
  readonly id: string;
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly sku?: string;
  readonly categoryId: string;
  readonly categoryName?: string;
  readonly primaryImageUrl?: string;
  readonly price: number;
  readonly currency: string;
  readonly inventoryCount: number;
  readonly lowStockThreshold: number;
  readonly isAvailable: boolean;
}

export interface CreateProductRequestDto {
  readonly name: string;
  readonly sku: string;
  readonly categoryId: string;
  readonly price: number;
  readonly currency: string;
  readonly stockQuantity: number;
}

export interface UpdateProductRequestDto {
  readonly name: string;
  readonly sku: string;
  readonly categoryId: string;
  readonly price: number;
  readonly currency: string;
  readonly stockQuantity: number;
  readonly isActive: boolean;
}
