import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegisterPage from "./page";

const registerMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("@/components/auth/auth-context", () => ({
  useAuth: () => ({
    register: registerMock,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({ get: () => null }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    registerMock.mockReset();
    replaceMock.mockReset();
  });

  it("shows validation errors for invalid registration data", async () => {
    const { container } = render(<RegisterPage />);
    const passwordInputs = container.querySelectorAll(
      'input[type="password"][autocomplete="new-password"]',
    );
    const passwordInput = passwordInputs[0] as HTMLInputElement;
    const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "bad-email" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "12345" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "54321" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 8 characters."),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("submits valid data and redirects to orders", async () => {
    registerMock.mockResolvedValue(undefined);
    const { container } = render(<RegisterPage />);
    const passwordInputs = container.querySelectorAll(
      'input[type="password"][autocomplete="new-password"]',
    );
    const passwordInput = passwordInputs[0] as HTMLInputElement;
    const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        "Jane Doe",
        "jane@example.com",
        "Password123!",
      );
      expect(replaceMock).toHaveBeenCalledWith("/account/orders");
    });
  });
});
