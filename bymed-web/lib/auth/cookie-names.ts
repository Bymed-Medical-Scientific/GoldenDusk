export const BYMED_ACCESS_COOKIE = "bymed_access";
export const BYMED_REFRESH_COOKIE = "bymed_refresh";

/** Slightly shorter than typical JWT access lifetime so cookies expire before the API rejects them. */
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 55 * 60;

/** Matches backend default refresh lifetime (7 days). */
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function cookieBaseOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
}
