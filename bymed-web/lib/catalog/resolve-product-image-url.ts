import { getPublicApiBaseUrl } from "@/lib/env";
import { joinUrl } from "@/lib/url";

/**
 * Turns API-relative image paths into absolute URLs for `<img src>`.
 */
export function resolveProductImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (url == null) return undefined;
  const u = url.trim();
  if (!u) return undefined;
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  const base = getPublicApiBaseUrl();
  if (!base) return undefined;
  return joinUrl(base, u.startsWith("/") ? u.slice(1) : u);
}
