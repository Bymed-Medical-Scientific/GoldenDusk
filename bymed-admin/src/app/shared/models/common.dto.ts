export interface PagedResultDto<TItem> {
  readonly items: TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

export interface ApiProblemDetailsDto {
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly traceId?: string;
  readonly errors?: Record<string, string[]>;
}
