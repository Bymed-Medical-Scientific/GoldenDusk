/**
 * Canonical site origin for metadata and JSON-LD (no trailing slash).
 * Set `NEXT_PUBLIC_SITE_URL` in production; Vercel sets `VERCEL_URL` when deployed.
 */
export function getSiteBaseUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return undefined;
}

export function absoluteUrl(pathOrUrl: string): string | undefined {
  const base = getSiteBaseUrl();
  if (!base) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${p}`;
}
