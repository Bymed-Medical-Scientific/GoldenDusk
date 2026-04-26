import type { SubmitQuoteRequest } from "@/types/quote";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function submitQuoteRequest(request: SubmitQuoteRequest): Promise<void> {
  const res = await apiFetch(
    apiPath("/quote-requests"),
    { method: "POST", body: JSON.stringify(request) },
    { retry: false },
  );
  await readJson(res);
}
