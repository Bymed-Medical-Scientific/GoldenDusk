import { addCartItem } from "@/lib/api/cart";
import type { CartViewItem } from "@/components/cart/cart-context";

/** Pushes guest local cart lines to the API so POST /Orders can resolve the cart (session cookie). */
export async function syncGuestCartToServer(items: CartViewItem[]): Promise<void> {
  for (const item of items) {
    await addCartItem({ productId: item.productId, quantity: item.quantity });
  }
}
