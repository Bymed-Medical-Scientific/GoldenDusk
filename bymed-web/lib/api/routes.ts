/** URL prefix; override if the API uses e.g. `/api/v1.0`. */
export const API_BASE_PATH =
  process.env.NEXT_PUBLIC_API_BASE_PATH?.replace(/\/$/, "") ?? "/api/v1";

export function apiPath(segment: string): string {
  const s = segment.startsWith("/") ? segment : `/${segment}`;
  return `${API_BASE_PATH}${s}`;
}
