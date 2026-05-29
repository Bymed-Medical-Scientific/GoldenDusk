export interface BrandDto {
  readonly id: string;
  readonly name: string;
  readonly logoUrl?: string | null;
  readonly websiteUrl?: string | null;
}

export interface CreateBrandRequestDto {
  readonly name: string;
  readonly websiteUrl?: string | null;
}

export interface UpdateBrandRequestDto {
  readonly name: string;
  readonly websiteUrl?: string | null;
}
