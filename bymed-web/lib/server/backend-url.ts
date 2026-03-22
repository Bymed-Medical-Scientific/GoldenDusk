import { getPublicApiBaseUrl } from "@/lib/env";
import { joinUrl } from "@/lib/url";
import { apiPath } from "@/lib/api/routes";

export function requireApiBaseUrl(): string {
  const base = getPublicApiBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return base;
}

export function backendApiUrl(relativeApiPath: string): string {
  return joinUrl(requireApiBaseUrl(), apiPath(relativeApiPath));
}
