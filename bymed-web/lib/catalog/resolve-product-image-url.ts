import { getPublicApiBaseUrl } from "@/lib/env";
import { joinUrl } from "@/lib/url";

/** True if path already includes an uploads segment (correct static file URL). */
function pathHasUploadsSegment(s: string): boolean {
  return /(^|\/)uploads\//i.test(s.replace(/\\/g, "/"));
}

/**
 * Legacy URLs omitted /uploads; files are served from wwwroot/uploads/original|thumb|medium.
 */
function ensureUploadsImagePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || pathHasUploadsSegment(trimmed)) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (/^\/(original|thumb|medium)\//i.test(u.pathname)) {
        u.pathname = `/uploads${u.pathname}`;
        return u.href;
      }
    } catch {
      /* ignore invalid URL */
    }
    return trimmed;
  }

  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (/^\/(original|thumb|medium)\//i.test(withSlash)) {
    const fixed = `/uploads${withSlash}`;
    return trimmed.startsWith("/") ? fixed : fixed.slice(1);
  }
  return trimmed;
}

/**
 * Turns API-relative image paths into absolute URLs for `<img src>` / `next/image`.
 *
 * Verify upstream: `curl -I http://127.0.0.1:5084/uploads/original/<file>` should be 200.
 * If image URLs were wrong in Redis catalog cache, invalidate catalog keys or wait for TTL.
 */
export function resolveProductImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (url == null) return undefined;
  const u = ensureUploadsImagePath(url.trim());
  if (!u) return undefined;
  if (u.startsWith("https://") || u.startsWith("http://")) {
    try {
      const parsed = new URL(u);
      // In Docker/prod, Next image optimizer runs in the web container.
      // Proxy API-hosted uploads through same-origin so optimizer never depends on external host reachability.
      if (/^\/uploads\//i.test(parsed.pathname)) {
        return `/api/bymed${parsed.pathname}${parsed.search}`;
      }
      return u;
    } catch {
      return u;
    }
  }
  if (u.startsWith("/uploads/")) return `/api/bymed${u}`;
  const base = getPublicApiBaseUrl();
  if (!base) return undefined;
  return joinUrl(base, u.startsWith("/") ? u.slice(1) : u);
}
