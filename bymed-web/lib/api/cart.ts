import type { AddToCartRequest, CartDto } from "@/types/cart";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function getCart(): Promise<CartDto> {
  const res = await apiFetch(apiPath("/Cart"), { method: "GET" });
  return readJson<CartDto>(res);
}

export async function addCartItem(body: AddToCartRequest): Promise<CartDto> {
  const res = await apiFetch(
    apiPath("/Cart/items"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<CartDto>(res);
}

/** Backend expects a JSON number as the raw body (not an object). */
export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<CartDto> {
  const res = await apiFetch(
    apiPath(`/Cart/items/${productId}`),
    {
      method: "PUT",
      body: JSON.stringify(quantity),
    },
    { retry: false },
  );
  return readJson<CartDto>(res);
}

export async function removeCartItem(productId: string): Promise<CartDto> {
  const res = await apiFetch(
    apiPath(`/Cart/items/${productId}`),
    { method: "DELETE" },
  );
  return readJson<CartDto>(res);
}

export async function clearCart(): Promise<void> {
  const res = await apiFetch(apiPath("/Cart"), { method: "DELETE" });
  await readJson<void>(res, [204]);
}
