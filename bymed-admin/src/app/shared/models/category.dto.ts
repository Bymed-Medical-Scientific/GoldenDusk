export interface CategoryDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
}

export interface CreateCategoryRequestDto {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
}

export interface UpdateCategoryRequestDto {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
}
