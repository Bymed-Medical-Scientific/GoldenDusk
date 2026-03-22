export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
};

export type CreateCategoryRequest = {
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
};

export type UpdateCategoryRequest = {
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
};
