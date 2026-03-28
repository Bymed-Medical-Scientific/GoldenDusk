import { backendApiUrl } from "@/lib/server/backend-url";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";
import {
  decodeJwtPayloadJson,
  isJwtExpiredOrMissingSlack,
  roleFromJwtPayload,
} from "@/lib/auth/jwt-payload";
import type { AuthUserDto } from "@/types/auth";
import { UserRole } from "@/types/enums";
import type { UserProfileDto } from "@/types/user";

export async function fetchProfileWithAccessToken(
  accessToken: string,
): Promise<UserProfileDto | null> {
  const res = await nodeFetchBymedApi(backendApiUrl("/Users/profile"), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as UserProfileDto;
}

export async function buildAuthUserFromSession(
  accessToken: string,
): Promise<AuthUserDto | null> {
  const profile = await fetchProfileWithAccessToken(accessToken);
  if (!profile) return null;
  const payload = decodeJwtPayloadJson(accessToken);
  const role = payload ? roleFromJwtPayload(payload) : UserRole.Customer;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role,
  };
}

export function shouldRefreshAccessToken(accessToken: string | undefined): boolean {
  if (!accessToken) return true;
  const payload = decodeJwtPayloadJson(accessToken);
  if (!payload) return true;
  return isJwtExpiredOrMissingSlack(payload);
}
