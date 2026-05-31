const CHECKOUT_IDEMPOTENCY_KEY = "bymed_checkout_idempotency_key";
const CHECKOUT_CART_FINGERPRINT_KEY = "bymed_checkout_cart_fingerprint";

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fingerprintCheckoutCart(
  items: readonly { productId: string; quantity: number }[],
): string {
  return [...items]
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join("|");
}

/**
 * Returns a stable idempotency key for this checkout attempt and cart contents.
 * Retries after network failure reuse the same key; a changed cart gets a new key.
 */
export function getOrCreateCheckoutIdempotencyKey(
  cartFingerprint: string,
): string {
  if (typeof window === "undefined") {
    return createIdempotencyKey();
  }

  const existing = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY)?.trim();
  const storedFingerprint = window.sessionStorage
    .getItem(CHECKOUT_CART_FINGERPRINT_KEY)
    ?.trim();

  if (existing && storedFingerprint === cartFingerprint) {
    return existing;
  }

  const key = createIdempotencyKey();
  window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY, key);
  window.sessionStorage.setItem(CHECKOUT_CART_FINGERPRINT_KEY, cartFingerprint);
  return key;
}

/** Clears the checkout attempt key after successful payment or a fresh checkout. */
export function clearCheckoutIdempotencyKey(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
  window.sessionStorage.removeItem(CHECKOUT_CART_FINGERPRINT_KEY);
}

export function peekCheckoutIdempotencyKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY)?.trim();
  return value || null;
}
