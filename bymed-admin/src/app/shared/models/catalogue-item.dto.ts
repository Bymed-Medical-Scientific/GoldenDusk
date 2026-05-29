export interface CatalogueItemImageDto {
  readonly id: string;
  readonly catalogueItemId: string;
  readonly url: string;
  readonly altText: string;
  readonly displayOrder: number;
}

export interface CatalogueItemDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly sku?: string;
  readonly categoryId: string;
  readonly categoryName?: string;
  readonly primaryImageUrl?: string;
  readonly images?: CatalogueItemImageDto[];
  readonly isPublished: boolean;
  readonly brand?: string;
}

export interface CreateCatalogueItemRequestDto {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categoryId: string;
  readonly sku?: string | null;
  readonly brand?: string | null;
  readonly isPublished: boolean;
}

export interface UpdateCatalogueItemRequestDto {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categoryId: string;
  readonly sku?: string | null;
  readonly brand?: string | null;
  readonly isPublished: boolean;
}
