import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  BYMED_ACCESS_COOKIE,
  BYMED_REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  cookieBaseOptions,
} from "@/lib/auth/cookie-names";

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
  res.cookies.set(BYMED_ACCESS_COOKIE, "", { ...base, maxAge: 0 });
  res.cookies.set(BYMED_REFRESH_COOKIE, "", { ...base, maxAge: 0 });
}
