export type CatalogueItemImageDto = {
  id: string;
  catalogueItemId: string;
  url: string;
  altText: string;
  displayOrder: number;
};

export type CatalogueItemDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  primaryImageUrl?: string | null;
  images?: CatalogueItemImageDto[] | null;
  isPublished: boolean;
  sku?: string | null;
  brand?: string | null;
};
