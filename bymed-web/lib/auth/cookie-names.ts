export const BYMED_ACCESS_COOKIE = "bymed_access";
export const BYMED_REFRESH_COOKIE = "bymed_refresh";

/** Slightly shorter than typical JWT access lifetime so cookies expire before the API rejects them. */
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 55 * 60;

/** Matches backend default refresh lifetime (7 days). */
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * `Secure` cookies are not stored on plain HTTP. Docker/local often uses http://localhost
 * while NODE_ENV=production — do not tie `secure` to NODE_ENV alone.
 * Set `AUTH_COOKIE_SECURE=true` when the storefront is served only over HTTPS.
 * Set `NEXT_PUBLIC_APP_URL` to the full browser origin (e.g. https://shop.example.com) for defaults.
 */
export function cookieBaseOptions() {
  const explicit = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  let secure: boolean;
  if (explicit === "true" || explicit === "1") {
    secure = true;
  } else if (explicit === "false" || explicit === "0") {
    secure = false;
  } else {
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      ""
    ).trim();
    if (appUrl.startsWith("https://")) {
      secure = true;
    } else if (appUrl.startsWith("http://")) {
      secure = false;
    } else {
      secure = false;
    }
  }
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
}
