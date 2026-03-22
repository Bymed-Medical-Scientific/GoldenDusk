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

  const unauthorized = () => {
    const res = NextResponse.json({ user: null }, { status: 401 });
    clearAuthCookies(res);
    return res;
  };

  if (access && !shouldRefreshAccessToken(access)) {
    const user = await buildAuthUserFromSession(access);
    if (user) return NextResponse.json({ user });
  }

  if (!refresh) return unauthorized();

  const tokens = await refreshTokensWithBackend(refresh);
  if (!tokens) return unauthorized();

  const user = await buildAuthUserFromSession(tokens.token);
  if (!user) return unauthorized();

  const res = NextResponse.json({ user });
  applyTokenCookies(res, tokens.token, tokens.refreshToken);
  return res;
}
