import type { PaymentInitiationResult, PaymentResult } from "@/types/payments";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function initiatePaymentForOrder(
  orderId: string,
): Promise<PaymentInitiationResult> {
  const res = await apiFetch(
    apiPath(`/Payments/orders/${orderId}/initiate`),
    { method: "POST" },
    { retry: false },
  );
  return readJson<PaymentInitiationResult>(res);
}

export async function confirmPaymentForOrder(
  orderId: string,
): Promise<PaymentResult> {
  const res = await apiFetch(
    apiPath(`/Payments/orders/${orderId}/confirm`),
    { method: "POST" },
    { retry: false },
  );
  return readJson<PaymentResult>(res);
}
