import { NextResponse } from "next/server";
import { BYMED_REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import { clearAuthCookies } from "@/lib/server/apply-auth-cookies";
import { backendApiUrl } from "@/lib/server/backend-url";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const jar = cookies();
  const refresh = jar.get(BYMED_REFRESH_COOKIE)?.value;

  if (refresh) {
    await nodeFetchBymedApi(backendApiUrl("/Auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
