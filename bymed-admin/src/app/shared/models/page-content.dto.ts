/** Mirrors API `PageMetadataDto` / `PageContentDto` (camelCase JSON). */
export interface PageMetadataDto {
  readonly metaTitle?: string | null;
  readonly metaDescription?: string | null;
  readonly ogImage?: string | null;
}

export interface PageContentSummaryDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly metadata: PageMetadataDto;
  readonly publishedAt?: string | null;
  readonly isPublished: boolean;
  readonly creationTime: string;
}

/** Request body for `PUT /api/v1/content/{slug}`. */
export interface UpdatePageContentRequestDto {
  readonly slug?: string | null;
  readonly title?: string | null;
  readonly content?: string | null;
  readonly metadata?: PageMetadataDto | null;
  /** When true/false, applies publish or unpublish when needed; omit only if unchanged (not used by admin UI). */
  readonly publishState?: boolean | null;
}

export interface ContentImageUploadDto {
  readonly url: string;
  readonly fileName: string;
}

export interface ContentVersionSummaryDto {
  readonly id: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface ContentVersionDetailDto extends ContentVersionSummaryDto {
  readonly content: string;
}
