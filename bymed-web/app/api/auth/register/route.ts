import { NextResponse } from "next/server";
import { applyTokenCookies } from "@/lib/server/apply-auth-cookies";
import { backendApiUrl } from "@/lib/server/backend-url";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const upstream = await nodeFetchBymedApi(backendApiUrl("/Auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const ct = upstream.headers.get("content-type") ?? "";
  const payload = ct.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  if (!upstream.ok) {
    return NextResponse.json(
      typeof payload === "object" && payload !== null ? payload : { error: payload },
      { status: upstream.status },
    );
  }

  const data = payload as {
    user: unknown;
    token?: string | null;
    refreshToken?: string | null;
    pendingAdminApproval?: boolean;
  };

  if (data.pendingAdminApproval || upstream.status === 202) {
    return NextResponse.json(
      { user: data.user, pendingAdminApproval: true },
      { status: 202 },
    );
  }

  if (!data.token || !data.refreshToken) {
    return NextResponse.json(
      { error: "Registration response missing session tokens." },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ user: data.user }, { status: 201 });
  applyTokenCookies(res, data.token, data.refreshToken);
  return res;
}
