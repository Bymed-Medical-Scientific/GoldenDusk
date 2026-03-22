import { NextResponse } from "next/server";
import { applyTokenCookies } from "@/lib/server/apply-auth-cookies";
import { backendApiUrl } from "@/lib/server/backend-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const upstream = await fetch(backendApiUrl("/Auth/register"), {
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
    token: string;
    refreshToken: string;
  };

  const res = NextResponse.json({ user: data.user }, { status: 201 });
  applyTokenCookies(res, data.token, data.refreshToken);
  return res;
}
