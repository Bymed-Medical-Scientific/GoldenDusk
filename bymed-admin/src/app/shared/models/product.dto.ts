export interface ProductImageDto {
  readonly id: string;
  readonly productId: string;
  readonly url: string;
  readonly altText: string;
  readonly displayOrder: number;
}

export interface ProductDto {
  readonly id: string;
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly sku?: string;
  readonly categoryId: string;
  readonly categoryName?: string;
  readonly primaryImageUrl?: string;
  readonly images?: ProductImageDto[];
  readonly price: number;
  readonly currency: string;
  readonly inventoryCount: number;
  readonly lowStockThreshold: number;
  readonly isAvailable: boolean;
}

export interface CreateProductRequestDto {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categoryId: string;
  readonly price: number;
  readonly inventoryCount: number;
  readonly lowStockThreshold: number;
  readonly sku?: string | null;
  readonly currency?: string | null;
  readonly specifications?: Record<string, string> | null;
}

export interface UpdateProductRequestDto {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categoryId: string;
  readonly price: number;
  readonly lowStockThreshold: number;
  readonly sku?: string | null;
  readonly specifications?: Record<string, string> | null;
}

export interface BulkDeleteProductsRequestDto {
  readonly productIds: string[];
}

export interface BulkSetProductAvailabilityRequestDto {
  readonly productIds: string[];
  readonly isAvailable: boolean;
}

export interface BulkOperationResultDto {
  readonly requestedCount: number;
  readonly processedCount: number;
  readonly notFoundCount: number;
}

export interface ImportProductsResultDto {
  readonly importedCount: number;
  readonly updatedCount: number;
  readonly failedCount: number;
  readonly errors: string[];
}
