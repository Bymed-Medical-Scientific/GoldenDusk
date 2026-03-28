import { getServerSideApiOrigin } from "@/lib/env";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";
import { joinUrl } from "@/lib/url";

/** Plain `/health` endpoint (not under `/api/v1`). */
export async function getHealthStatus(): Promise<Response> {
  const base = getServerSideApiOrigin();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return nodeFetchBymedApi(joinUrl(base, "/health"), {
    method: "GET",
    credentials: "include",
  });
}
