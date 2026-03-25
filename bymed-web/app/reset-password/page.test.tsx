import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetPasswordPage from "./page";

const resetPasswordMock = jest.fn();

jest.mock("@/lib/api/auth", () => ({
  resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    resetPasswordMock.mockReset();
  });

  it("validates email before submit", async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("submits request and shows confirmation message", async () => {
    resetPasswordMock.mockResolvedValue(undefined);
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "reset@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        email: "reset@example.com",
      });
    });
    expect(
      await screen.findByText(
        "If an account exists for this email, a password reset link has been sent.",
      ),
    ).toBeInTheDocument();
  });
});
