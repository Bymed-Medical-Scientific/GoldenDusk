import { NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-url";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (!email || !token) {
    return NextResponse.json(
      { error: "Missing email or verification token." },
      { status: 400 },
    );
  }

  const upstreamUrl = `${backendApiUrl("/Auth/confirm-email")}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const upstream = await nodeFetchBymedApi(upstreamUrl, { method: "GET" });

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const ct = upstream.headers.get("content-type") ?? "";
  const payload = ct.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  return NextResponse.json(
    typeof payload === "object" && payload !== null ? payload : { error: payload },
    { status: upstream.status },
  );
}
