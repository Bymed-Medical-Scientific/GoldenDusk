import type { NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-url";
import { applyTokenCookies } from "@/lib/server/apply-auth-cookies";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";
import type { RefreshTokenResponse } from "@/types/auth";

export async function refreshTokensWithBackend(
  refreshToken: string,
): Promise<RefreshTokenResponse | null> {
  const res = await nodeFetchBymedApi(backendApiUrl("/Auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return (await res.json()) as RefreshTokenResponse;
}

export async function refreshAndApplyCookies(
  refreshToken: string,
  res: NextResponse,
): Promise<RefreshTokenResponse | null> {
  const tokens = await refreshTokensWithBackend(refreshToken);
  if (!tokens) return null;
  applyTokenCookies(res, tokens.token, tokens.refreshToken);
  return tokens;
}
