"use client";

import { CheckoutPageContent } from "@/components/checkout/checkout-page-content";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockReplace = jest.fn();
const mockCreateOrder = jest.fn();
const mockInitiatePaymentForOrder = jest.fn();
const mockConfirmPaymentForOrder = jest.fn();
const mockClearCart = jest.fn();
const mockSyncGuestCartToServer = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/components/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "customer@example.com", name: "Customer", role: 0 },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

jest.mock("@/components/cart/cart-context", () => ({
  GUEST_CART_STORAGE_KEY: "bymed_guest_cart_v1",
  useCart: () => ({
    items: [
      {
        productId: "p1",
        quantity: 2,
        unitPrice: 50,
        lineTotal: 100,
        product: { name: "Microscope", currency: "USD" },
      },
    ],
    totalItems: 2,
    total: 100,
    isLoading: false,
    error: null,
    refresh: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/components/price/formatted-price", () => ({
  FormattedPrice: ({ amount }: { amount: number }) => (
    <span data-testid="formatted-price">{amount.toFixed(2)}</span>
  ),
}));

jest.mock("@/lib/api/orders", () => ({
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
}));

jest.mock("@/lib/api/payments", () => ({
  initiatePaymentForOrder: (...args: unknown[]) => mockInitiatePaymentForOrder(...args),
  confirmPaymentForOrder: (...args: unknown[]) => mockConfirmPaymentForOrder(...args),
}));

jest.mock("@/lib/api/cart", () => ({
  clearCart: (...args: unknown[]) => mockClearCart(...args),
}));

jest.mock("@/lib/checkout/sync-guest-cart", () => ({
  syncGuestCartToServer: (...args: unknown[]) => mockSyncGuestCartToServer(...args),
}));

describe("CheckoutPageContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOrder.mockResolvedValue({ id: "order-1" });
    mockInitiatePaymentForOrder.mockResolvedValue({
      success: false,
      errorMessage: "Payment gateway unavailable.",
    });
    mockConfirmPaymentForOrder.mockResolvedValue({
      success: false,
      status: 0,
      errorMessage: "Pending",
    });
    mockClearCart.mockResolvedValue(undefined);
    mockSyncGuestCartToServer.mockResolvedValue(undefined);
  });

  it("shows required field errors before proceeding", async () => {
    render(<CheckoutPageContent />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Full name is required.")).toBeInTheDocument();
    expect(screen.getByText("Address line 1 is required.")).toBeInTheDocument();
    expect(screen.getByText("City is required.")).toBeInTheDocument();
    expect(screen.getByText("Phone number is required.")).toBeInTheDocument();
  });

  it("displays payment error when PayNow initiation fails", async () => {
    render(<CheckoutPageContent />);

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Address line 1"), { target: { value: "123 Lab St" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Harare" } });
    fireEvent.change(screen.getByLabelText("State / region"), { target: { value: "Harare" } });
    fireEvent.change(screen.getByLabelText("Postal code"), { target: { value: "00263" } });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "ZW" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+263700000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByLabelText("Email");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Name on order"), { target: { value: "Jane Doe" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByText("Payment method:");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByRole("button", { name: "Place order and pay" });
    fireEvent.click(screen.getByRole("button", { name: "Place order and pay" }));

    await waitFor(() => {
      expect(screen.getByText("Payment gateway unavailable.")).toBeInTheDocument();
    });
  });
});
