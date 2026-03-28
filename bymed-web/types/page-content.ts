export type PageMetadataDto = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
};

export type PageContentDto = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metadata: PageMetadataDto;
  publishedAt?: string | null;
  isPublished: boolean;
  creationTime: string;
};

export type UpdatePageContentRequest = {
  slug?: string | null;
  title?: string | null;
  content?: string | null;
  metadata?: PageMetadataDto | null;
  /** Admin: publish or unpublish when combined with save. */
  publishState?: boolean | null;
};

export type ContentImageUploadDto = {
  url: string;
  fileName: string;
};
