import type { PagedResult } from "@/types/api-common";
import type { OrderStatus } from "@/types/enums";
import type {
  CreateOrderRequest,
  OrderAnalyticsResult,
  OrderDto,
  UpdateOrderStatusRequest,
} from "@/types/order";
import { apiFetch, readJson, readTextResponse } from "./http";
import { apiPath } from "./routes";

export async function createOrder(body: CreateOrderRequest): Promise<OrderDto> {
  const res = await apiFetch(
    apiPath("/Orders"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<OrderDto>(res, [200, 201]);
}

export type ListMyOrdersParams = {
  pageNumber?: number;
  pageSize?: number;
};

export async function listMyOrders(
  params: ListMyOrdersParams = {},
): Promise<PagedResult<OrderDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Orders/my-orders${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<PagedResult<OrderDto>>(res);
}

export async function getOrderById(id: string): Promise<OrderDto> {
  const res = await apiFetch(apiPath(`/Orders/${id}`), { method: "GET" });
  return readJson<OrderDto>(res);
}

export async function updateOrderStatus(
  id: string,
  body: UpdateOrderStatusRequest,
): Promise<OrderDto> {
  const res = await apiFetch(
    apiPath(`/Orders/${id}/status`),
    { method: "PUT", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<OrderDto>(res);
}

export type ListAllOrdersParams = {
  pageNumber?: number;
  pageSize?: number;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
};

export async function listAllOrders(
  params: ListAllOrdersParams = {},
): Promise<PagedResult<OrderDto>> {
  const q = new URLSearchParams();
  if (params.pageNumber != null) q.set("pageNumber", String(params.pageNumber));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.status != null) q.set("status", String(params.status));
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Orders${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<PagedResult<OrderDto>>(res);
}

export type OrderAnalyticsParams = {
  dateFrom?: string;
  dateTo?: string;
};

export async function getOrderAnalytics(
  params: OrderAnalyticsParams = {},
): Promise<OrderAnalyticsResult> {
  const q = new URLSearchParams();
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Orders/analytics${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readJson<OrderAnalyticsResult>(res);
}

export type ExportOrdersParams = {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

/** Returns raw CSV text (admin). */
export async function exportOrdersCsv(
  params: ExportOrdersParams = {},
): Promise<string> {
  const q = new URLSearchParams();
  if (params.status != null) q.set("status", String(params.status));
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  if (params.search?.trim()) q.set("search", params.search.trim());
  const qs = q.toString();
  const res = await apiFetch(
    apiPath(`/Orders/export${qs ? `?${qs}` : ""}`),
    { method: "GET" },
  );
  return readTextResponse(res);
}
