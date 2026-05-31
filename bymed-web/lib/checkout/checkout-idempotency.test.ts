import {
  clearCheckoutIdempotencyKey,
  fingerprintCheckoutCart,
  getOrCreateCheckoutIdempotencyKey,
  peekCheckoutIdempotencyKey,
} from "@/lib/checkout/checkout-idempotency";

describe("checkout idempotency", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("creates and persists a key for the checkout attempt", () => {
    const fingerprint = fingerprintCheckoutCart([
      { productId: "p1", quantity: 2 },
    ]);
    const first = getOrCreateCheckoutIdempotencyKey(fingerprint);
    const second = getOrCreateCheckoutIdempotencyKey(fingerprint);

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(peekCheckoutIdempotencyKey()).toBe(first);
  });

  it("issues a new key when the cart fingerprint changes", () => {
    const firstFingerprint = fingerprintCheckoutCart([
      { productId: "p1", quantity: 1 },
    ]);
    const secondFingerprint = fingerprintCheckoutCart([
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 1 },
    ]);

    const firstKey = getOrCreateCheckoutIdempotencyKey(firstFingerprint);
    const secondKey = getOrCreateCheckoutIdempotencyKey(secondFingerprint);

    expect(secondKey).not.toBe(firstKey);
  });

  it("clears the persisted key", () => {
    getOrCreateCheckoutIdempotencyKey(
      fingerprintCheckoutCart([{ productId: "p1", quantity: 1 }]),
    );
    clearCheckoutIdempotencyKey();
    expect(peekCheckoutIdempotencyKey()).toBeNull();
  });
});
