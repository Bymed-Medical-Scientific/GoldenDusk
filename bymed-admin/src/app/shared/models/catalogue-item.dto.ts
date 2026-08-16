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
  readonly categoryId: string;
  readonly categoryName?: string;
  readonly primaryImageUrl?: string;
  readonly images?: CatalogueItemImageDto[];
  readonly isPublished: boolean;
  readonly brandId?: string | null;
  readonly brandName?: string | null;
  readonly brandLogoUrl?: string | null;
  readonly brandWebsiteUrl?: string | null;
}

export interface CreateCatalogueItemRequestDto {
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly brandId?: string | null;
  readonly isPublished: boolean;
}

export interface UpdateCatalogueItemRequestDto {
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly brandId?: string | null;
  readonly isPublished: boolean;
}
