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
