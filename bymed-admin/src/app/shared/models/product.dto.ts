export interface ProductDto {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly categoryId: string;
  readonly price: number;
  readonly currency: string;
  readonly stockQuantity: number;
  readonly isActive: boolean;
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
