import type { PagedResult } from "@/types/api-common";
import type {
  CreateProductRequest,
  ProductDto,
  ProductImageDto,
  UpdateProductRequest,
} from "@/types/product";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export type ListProductsParams = {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  inStock?: boolean;
};

export async function listProducts(
  params: ListProductsParams = {},
): Promise<PagedResult<ProductDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.search != null && params.search !== "")
    q.set("search", params.search);
  if (params.inStock != null) q.set("inStock", String(params.inStock));
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Products${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<PagedResult<ProductDto>>(res);
}

export async function getProductById(id: string): Promise<ProductDto> {
  const res = await apiFetch(apiPath(`/Products/${id}`), { method: "GET" });
  return readJson<ProductDto>(res);
}

export async function createProduct(
  body: CreateProductRequest,
): Promise<ProductDto> {
  const res = await apiFetch(
    apiPath("/Products"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<ProductDto>(res, [200, 201]);
}

export async function updateProduct(
  id: string,
  body: UpdateProductRequest,
): Promise<ProductDto> {
  const res = await apiFetch(
    apiPath(`/Products/${id}`),
    { method: "PUT", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<ProductDto>(res);
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await apiFetch(apiPath(`/Products/${id}`), {
    method: "DELETE",
  });
  await readJson<void>(res, [204]);
}

export async function uploadProductImage(
  productId: string,
  file: File,
  altText?: string,
): Promise<ProductImageDto> {
  const form = new FormData();
  form.append("file", file);
  if (altText != null) form.append("altText", altText);
  const res = await apiFetch(
    apiPath(`/Products/${productId}/images`),
    { method: "POST", body: form },
    { retry: false },
  );
  return readJson<ProductImageDto>(res, [200, 201]);
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  const res = await apiFetch(
    apiPath(`/Products/${productId}/images/${imageId}`),
    { method: "DELETE" },
  );
  await readJson<void>(res, [204]);
}
