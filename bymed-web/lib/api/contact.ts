import type { ContactFormDto, SubmitContactFormRequest } from "@/types/contact";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function submitContactForm(
  body: SubmitContactFormRequest,
): Promise<ContactFormDto> {
  const res = await apiFetch(
    apiPath("/contact"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  return readJson<ContactFormDto>(res);
}
