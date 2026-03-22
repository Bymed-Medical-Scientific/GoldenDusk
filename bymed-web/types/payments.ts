import type { PaymentStatus } from "./enums";

export type PaymentInitiationResult = {
  success: boolean;
  paymentReference?: string | null;
  redirectUrl?: string | null;
  pollUrl?: string | null;
  errorMessage?: string | null;
};

export type PaymentResult = {
  success: boolean;
  transactionId?: string | null;
  status: PaymentStatus;
  errorMessage?: string | null;
};
