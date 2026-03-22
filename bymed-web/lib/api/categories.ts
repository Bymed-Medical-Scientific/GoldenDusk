import type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/category";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function listCategories(): Promise<CategoryDto[]> {
  const res = await apiFetch(apiPath("/Categories"), { method: "GET" });
  return readJson<CategoryDto[]>(res);
}

export async function getCategoryById(id: string): Promise<CategoryDto> {
  const res = await apiFetch(apiPath(`/Categories/${id}`), { method: "GET" });
  return readJson<CategoryDto>(res);
}

export async function createCategory(
  body: CreateCategoryRequest,
): Promise<CategoryDto> {
  const res = await apiFetch(
    apiPath("/Categories"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<CategoryDto>(res, [200, 201]);
}

export async function updateCategory(
  id: string,
  body: UpdateCategoryRequest,
): Promise<CategoryDto> {
  const res = await apiFetch(
    apiPath(`/Categories/${id}`),
    { method: "PUT", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<CategoryDto>(res);
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiFetch(apiPath(`/Categories/${id}`), {
    method: "DELETE",
  });
  await readJson<void>(res, [204]);
}
