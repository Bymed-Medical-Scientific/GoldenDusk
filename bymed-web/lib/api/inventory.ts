import type { PagedResult } from "@/types/api-common";
import type {
  AdjustInventoryRequest,
  InventoryDto,
  InventoryLogDto,
} from "@/types/inventory";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export type ListInventoryParams = {
  pageNumber?: number;
  pageSize?: number;
  lowStockOnly?: boolean;
};

export async function listInventory(
  params: ListInventoryParams = {},
): Promise<PagedResult<InventoryDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.lowStockOnly != null)
    q.set("lowStockOnly", String(params.lowStockOnly));
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Inventory${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<PagedResult<InventoryDto>>(res);
}

export async function listLowStockInventory(): Promise<InventoryDto[]> {
  const res = await apiFetch(apiPath("/Inventory/low-stock"), {
    method: "GET",
  });
  return readJson<InventoryDto[]>(res);
}

export type InventoryHistoryParams = {
  pageNumber?: number;
  pageSize?: number;
};

export async function getInventoryHistory(
  productId: string,
  params: InventoryHistoryParams = {},
): Promise<PagedResult<InventoryLogDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Inventory/history/${productId}${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<PagedResult<InventoryLogDto>>(res);
}

export async function adjustInventory(
  productId: string,
  body: AdjustInventoryRequest,
): Promise<InventoryDto> {
  const q = new URLSearchParams({ productId });
  const res = await apiFetch(
    apiPath(`/Inventory/adjust?${q.toString()}`),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<InventoryDto>(res);
}
