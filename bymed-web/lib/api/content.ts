import type { PagedResult } from "@/types/api-common";
import type {
  ContentImageUploadDto,
  PageContentDto,
  UpdatePageContentRequest,
} from "@/types/page-content";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export type ListContentPagesParams = {
  pageNumber?: number;
  pageSize?: number;
};

export async function listContentPages(
  params: ListContentPagesParams = {},
): Promise<PagedResult<PageContentDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/content${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<PagedResult<PageContentDto>>(res);
}

export async function getPageBySlug(slug: string): Promise<PageContentDto> {
  const enc = encodeURIComponent(slug);
  const res = await apiFetch(apiPath(`/content/${enc}`), { method: "GET" });
  return readJson<PageContentDto>(res);
}

export async function updatePageBySlug(
  slug: string,
  body: UpdatePageContentRequest,
): Promise<PageContentDto> {
  const enc = encodeURIComponent(slug);
  const res = await apiFetch(
    apiPath(`/content/${enc}`),
    { method: "PUT", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<PageContentDto>(res);
}

export async function uploadContentImage(
  file: File,
): Promise<ContentImageUploadDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch(
    apiPath("/content/images"),
    { method: "POST", body: form },
    { retry: false },
  );
  return readJson<ContentImageUploadDto>(res, [200, 201]);
}
