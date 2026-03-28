/** URL prefix for Bymed.API versioned routes (see `Bymed.API` controllers). */
function normalizeApiBasePath(raw: string | undefined): string {
  const trimmed = raw?.replace(/\/$/, "").trim();
  if (!trimmed) return "/api/v1";
  // `/api` alone would hit unversioned 404s; default to the same version segment as the backend.
  if (trimmed === "/api") return "/api/v1";
  return trimmed;
}

export const API_BASE_PATH = normalizeApiBasePath(
  process.env.NEXT_PUBLIC_API_BASE_PATH,
);

export function apiPath(segment: string): string {
  const s = segment.startsWith("/") ? segment : `/${segment}`;
  return `${API_BASE_PATH}${s}`;
}
