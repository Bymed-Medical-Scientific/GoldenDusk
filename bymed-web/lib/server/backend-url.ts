import { getServerSideApiOrigin } from "@/lib/env";
import { joinUrl } from "@/lib/url";
import { apiPath } from "@/lib/api/routes";

/** Upstream Bymed.API origin for server-side fetch (proxy, session refresh). */
export function requireApiBaseUrl(): string {
  const base = getServerSideApiOrigin();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured (or set BYMED_API_INTERNAL_URL for SSR).",
    );
  }
  return base;
}

export function backendApiUrl(relativeApiPath: string): string {
  return joinUrl(requireApiBaseUrl(), apiPath(relativeApiPath));
}
