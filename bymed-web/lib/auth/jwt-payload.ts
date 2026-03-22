import { UserRole } from "@/types/enums";

const ROLE_CLAIM_LONG =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function decodeJwtPayloadJson(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtExp(payload: Record<string, unknown>): number | null {
  const exp = payload.exp;
  if (typeof exp === "number") return exp;
  return null;
}

export function isJwtExpiredOrMissingSlack(
  payload: Record<string, unknown>,
  slackSeconds = 120,
): boolean {
  const exp = getJwtExp(payload);
  if (exp == null) return true;
  return Date.now() / 1000 >= exp - slackSeconds;
}

export function roleFromJwtPayload(payload: Record<string, unknown>): UserRole {
  const raw = payload[ROLE_CLAIM_LONG] ?? payload.role;
  if (raw === "Admin" || raw === 1) return UserRole.Admin;
  return UserRole.Customer;
}
