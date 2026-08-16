import type { PagedResult } from "@/types/api-common";
import type { CatalogueItemDto } from "@/types/catalogue-item";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

const REVALIDATE_SECONDS = 120;

export type ListCatalogueItemsParams = {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  brandId?: string;
  isPublished?: boolean;
};

export async function listCatalogueItems(
  params: ListCatalogueItemsParams = {},
): Promise<PagedResult<CatalogueItemDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.search != null && params.search !== "") q.set("search", params.search);
  if (params.brandId) q.set("brandId", params.brandId);
  q.set("isPublished", String(params.isPublished ?? true));
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/catalogue-items${qs ? `?${qs}` : ""}`),
    { method: "GET" },
    {
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["catalogue-items"],
      },
    },
  );
  return readJson<PagedResult<CatalogueItemDto>>(res);
}

export async function getCatalogueItemById(id: string): Promise<CatalogueItemDto> {
  const res = await apiFetch(
    apiPath(`/catalogue-items/${id}`),
    { method: "GET" },
    {
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["catalogue-items", `catalogue-item:${id}`],
      },
    },
  );
  return readJson<CatalogueItemDto>(res);
}

export async function getCatalogueItemBySlug(slug: string): Promise<CatalogueItemDto> {
  const encoded = encodeURIComponent(slug.trim());
  const res = await apiFetch(
    apiPath(`/catalogue-items/by-slug/${encoded}`),
    { method: "GET" },
    {
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["catalogue-items", `catalogue-item-slug:${slug.trim()}`],
      },
    },
  );
  return readJson<CatalogueItemDto>(res);
}
