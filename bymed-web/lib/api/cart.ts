import type { AddToCartRequest, CartDto } from "@/types/cart";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

type CartApiOptions = {
  /** Use Next.js BFF proxy so auth cookie can supply Bearer token. */
  forceProxy?: boolean;
};

export async function getCart(options: CartApiOptions = {}): Promise<CartDto> {
  const res = await apiFetch(
    apiPath("/Cart"),
    { method: "GET" },
    { forceProxy: options.forceProxy },
  );
  return readJson<CartDto>(res);
}

export async function addCartItem(
  body: AddToCartRequest,
  options: CartApiOptions = {},
): Promise<CartDto> {
  const res = await apiFetch(
    apiPath("/Cart/items"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false, forceProxy: options.forceProxy },
  );
  return readJson<CartDto>(res);
}

/** Backend expects a JSON number as the raw body (not an object). */
export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
  options: CartApiOptions = {},
): Promise<CartDto> {
  const res = await apiFetch(
    apiPath(`/Cart/items/${productId}`),
    {
      method: "PUT",
      body: JSON.stringify(quantity),
    },
    { retry: false, forceProxy: options.forceProxy },
  );
  return readJson<CartDto>(res);
}

export async function removeCartItem(
  productId: string,
  options: CartApiOptions = {},
): Promise<CartDto> {
  const res = await apiFetch(
    apiPath(`/Cart/items/${productId}`),
    { method: "DELETE" },
    { forceProxy: options.forceProxy },
  );
  return readJson<CartDto>(res);
}

export async function clearCart(options: CartApiOptions = {}): Promise<void> {
  const res = await apiFetch(
    apiPath("/Cart"),
    { method: "DELETE" },
    { forceProxy: options.forceProxy },
  );
  await readJson<void>(res, [204]);
}
