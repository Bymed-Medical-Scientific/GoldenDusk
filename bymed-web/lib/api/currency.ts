import type { CurrencyDetectResponse, ExchangeRates } from "@/types/currency";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function getExchangeRates(): Promise<ExchangeRates> {
  const res = await apiFetch(apiPath("/Currency/rates"), { method: "GET" });
  return readJson<ExchangeRates>(res);
}

export async function detectCurrency(): Promise<CurrencyDetectResponse> {
  const res = await apiFetch(apiPath("/Currency/detect"), { method: "GET" });
  return readJson<CurrencyDetectResponse>(res);
}
