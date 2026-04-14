import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  BYMED_ACCESS_COOKIE,
  BYMED_REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  cookieBaseOptions,
} from "@/lib/auth/cookie-names";

/**
 * `ResponseCookies` keeps only one entry per cookie name; repeated `set()` overwrites.
 * To clear both http and https variants we must emit a second `Set-Cookie` via append.
 */
function appendClearCookieHeader(
  res: NextResponse,
  name: string,
  opts: {
    path: string;
    maxAge: number;
    expires: Date;
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none";
    secure: boolean;
  },
): void {
  const parts = [
    `${name}=`,
    `Path=${opts.path}`,
    `Expires=${opts.expires.toUTCString()}`,
    `Max-Age=${opts.maxAge}`,
    opts.httpOnly ? "HttpOnly" : "",
    `SameSite=${opts.sameSite}`,
    opts.secure ? "Secure" : "",
  ].filter(Boolean);
  res.headers.append("Set-Cookie", parts.join("; "));
}

export function applyTokenCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const base = cookieBaseOptions();
  res.cookies.set(BYMED_ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  res.cookies.set(BYMED_REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  const base = cookieBaseOptions();
  const expired = new Date(0);
  const clearOpts = { ...base, maxAge: 0, expires: expired };
  res.cookies.set(BYMED_ACCESS_COOKIE, "", clearOpts);
  res.cookies.set(BYMED_REFRESH_COOKIE, "", clearOpts);
  // Alternate Secure flag (migration / mixed deploys). Must be a separate header — see note above.
  const alt = { ...clearOpts, secure: !base.secure };
  appendClearCookieHeader(res, BYMED_ACCESS_COOKIE, alt);
  appendClearCookieHeader(res, BYMED_REFRESH_COOKIE, alt);
}
