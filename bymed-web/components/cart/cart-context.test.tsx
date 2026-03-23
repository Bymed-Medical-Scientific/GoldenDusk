import { CartProvider, useCart, type CartProductSnapshot } from "@/components/cart/cart-context";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/components/auth/auth-context", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    refreshSession: async () => undefined,
    login: async () => undefined,
    register: async () => undefined,
    logout: async () => undefined,
  }),
}));

jest.mock("@/lib/api/cart", () => ({
  addCartItem: jest.fn(),
  getCart: jest.fn(),
  removeCartItem: jest.fn(),
  updateCartItemQuantity: jest.fn(),
}));

jest.mock("@/lib/api/products", () => ({
  getProductById: jest.fn(),
}));

const GUEST_CART_STORAGE_KEY = "bymed_guest_cart_v1";

const sampleProduct: CartProductSnapshot = {
  productId: "8d352f48-5c9e-4c8d-b429-cf49f4f31df9",
  name: "Microscope",
  imageUrl: null,
  currency: "USD",
  isAvailable: true,
};

function CartProbe() {
  const { isLoading, totalItems, total, addItem, updateQuantity, removeItem } = useCart();
  if (isLoading) return <p>loading</p>;

  return (
    <div>
      <p data-testid="total-items">{totalItems}</p>
      <p data-testid="total-amount">{total}</p>
      <button
        type="button"
        onClick={() => {
          void addItem(sampleProduct, 2, 10);
        }}
      >
        add-two
      </button>
      <button
        type="button"
        onClick={() => {
          void addItem(sampleProduct, 1, 10);
        }}
      >
        add-one
      </button>
      <button
        type="button"
        onClick={() => {
          void updateQuantity(sampleProduct.productId, 5);
        }}
      >
        qty-five
      </button>
      <button
        type="button"
        onClick={() => {
          void removeItem(sampleProduct.productId);
        }}
      >
        remove
      </button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartProbe />
    </CartProvider>,
  );
}

describe("CartProvider guest cart behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("calculates totals in real time when items are added", async () => {
    renderCart();

    await screen.findByTestId("total-items");
    fireEvent.click(screen.getByRole("button", { name: "add-two" }));
    fireEvent.click(screen.getByRole("button", { name: "add-one" }));

    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("3"),
    );
    expect(screen.getByTestId("total-amount")).toHaveTextContent("30");
  });

  it("updates quantity and recalculates totals", async () => {
    renderCart();

    await screen.findByTestId("total-items");
    fireEvent.click(screen.getByRole("button", { name: "add-two" }));
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("2"),
    );

    fireEvent.click(screen.getByRole("button", { name: "qty-five" }));
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("5"),
    );
    expect(screen.getByTestId("total-amount")).toHaveTextContent("50");
  });

  it("removes an item from cart state", async () => {
    renderCart();

    await screen.findByTestId("total-items");
    fireEvent.click(screen.getByRole("button", { name: "add-two" }));
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("2"),
    );

    fireEvent.click(screen.getByRole("button", { name: "remove" }));
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("0"),
    );
    expect(screen.getByTestId("total-amount")).toHaveTextContent("0");
  });

  it("persists guest cart in localStorage and rehydrates on reload", async () => {
    const first = renderCart();

    await screen.findByTestId("total-items");
    fireEvent.click(screen.getByRole("button", { name: "add-two" }));
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("2"),
    );

    const saved = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    expect(saved).toBeTruthy();
    expect(saved).toContain(sampleProduct.productId);
    expect(saved).toContain('"quantity":2');

    first.unmount();
    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("2"),
    );
    expect(screen.getByTestId("total-amount")).toHaveTextContent("20");
  });
});
