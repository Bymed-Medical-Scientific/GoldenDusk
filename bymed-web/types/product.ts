export type ProductImageDto = {
  id: string;
  productId: string;
  url: string;
  altText: string;
  displayOrder: number;
};

export type ProductDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  primaryImageUrl?: string | null;
  images?: ProductImageDto[] | null;
  price: number;
  currency: string;
  isAvailable: boolean;
  sku?: string | null;
  brand?: string | null;
  clientType?: string | null;
  specifications?: Record<string, string> | null;
};

export type CreateProductRequest = {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  brand?: string | null;
  clientType?: string | null;
  currency?: string | null;
  specifications?: Record<string, string> | null;
};

export type UpdateProductRequest = {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  sku?: string | null;
  brand?: string | null;
  clientType?: string | null;
  specifications?: Record<string, string> | null;
};
