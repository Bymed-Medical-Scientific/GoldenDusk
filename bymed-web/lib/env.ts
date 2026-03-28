function normalizeApiOrigin(rawInput: string): string {
  let raw = rawInput.trim().replace(/\/+$/, "");
  if (raw.endsWith("/api")) {
    raw = raw.slice(0, -4).replace(/\/+$/, "");
  }
  return raw;
}

/** Matches Bymed.API `launchSettings` HTTP URL when the HTTPS profile is used (Kestrel binds both). */
const DEV_DEFAULT_API_ORIGIN = "http://127.0.0.1:5084";

/**
 * Kestrel origin only (scheme + host + port). No URL path.
 *
 * Catalog calls prepend `/api/v1` (see `lib/api/routes.ts` / `apiPath`).
 * If `NEXT_PUBLIC_API_URL` mistakenly ends with `/api`, it is stripped so requests do not
 * become `.../api/api/v1/...` (404).
 *
 * In **development**, if the variable is unset, defaults to {@link DEV_DEFAULT_API_ORIGIN} so
 * `next dev` works without `.env.local`.
 */
export function getPublicApiBaseUrl(): string {
  let raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!raw && process.env.NODE_ENV === "development") {
    raw = DEV_DEFAULT_API_ORIGIN;
  }
  return normalizeApiOrigin(raw);
}

/**
 * Origin used when Next.js (Node) calls the Bymed API — SSR, route handlers, proxy.
 * Defaults to {@link getPublicApiBaseUrl}. Set `BYMED_API_INTERNAL_URL` to loopback HTTP
 * (e.g. `http://127.0.0.1:5084`) so server `fetch` avoids TLS failures to
 * `https://localhost:7107` while the browser can still use the public HTTPS URL.
 */
export function getServerSideApiOrigin(): string {
  const internal = process.env.BYMED_API_INTERNAL_URL?.trim() ?? "";
  if (internal) {
    return normalizeApiOrigin(internal);
  }
  const pub = getPublicApiBaseUrl();
  if (
    process.env.NODE_ENV === "development" &&
    pub &&
    process.env.BYMED_DISABLE_DEV_HTTP_FALLBACK !== "1"
  ) {
    try {
      const u = new URL(pub);
      if (
        u.protocol === "https:" &&
        (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
        u.port === "7107"
      ) {
        return "http://127.0.0.1:5084";
      }
    } catch {
      /* ignore */
    }
  }
  return pub;
}
