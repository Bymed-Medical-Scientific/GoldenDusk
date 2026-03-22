import { NextResponse } from "next/server";
import { BYMED_REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import {
  applyTokenCookies,
  clearAuthCookies,
} from "@/lib/server/apply-auth-cookies";
import { refreshTokensWithBackend } from "@/lib/server/refresh-session";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const jar = cookies();
  const refresh = jar.get(BYMED_REFRESH_COOKIE)?.value;
  if (!refresh) {
    const res = NextResponse.json({ ok: false }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const tokens = await refreshTokensWithBackend(refresh);
  if (!tokens) {
    const res = NextResponse.json({ ok: false }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  applyTokenCookies(res, tokens.token, tokens.refreshToken);
  return res;
}
