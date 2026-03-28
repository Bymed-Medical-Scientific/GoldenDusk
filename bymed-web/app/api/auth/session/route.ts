import { NextResponse } from "next/server";
import { BYMED_ACCESS_COOKIE, BYMED_REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import {
  applyTokenCookies,
  clearAuthCookies,
} from "@/lib/server/apply-auth-cookies";
import { buildAuthUserFromSession, shouldRefreshAccessToken } from "@/lib/server/fetch-user-session";
import { refreshTokensWithBackend } from "@/lib/server/refresh-session";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = cookies();
  const access = jar.get(BYMED_ACCESS_COOKIE)?.value;
  const refresh = jar.get(BYMED_REFRESH_COOKIE)?.value;

  /** Logged-out and guest browsers: 200 so fetch is not a console error; body still has user: null. */
  const guestResponse = (clearCookies: boolean) => {
    const res = NextResponse.json({ user: null });
    if (clearCookies) clearAuthCookies(res);
    return res;
  };

  if (access && !shouldRefreshAccessToken(access)) {
    const user = await buildAuthUserFromSession(access);
    if (user) return NextResponse.json({ user });
  }

  if (!refresh) return guestResponse(false);

  const tokens = await refreshTokensWithBackend(refresh);
  if (!tokens) return guestResponse(true);

  const user = await buildAuthUserFromSession(tokens.token);
  if (!user) return guestResponse(true);

  const res = NextResponse.json({ user });
  applyTokenCookies(res, tokens.token, tokens.refreshToken);
  return res;
}
