import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BYMED_ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { requireApiBaseUrl } from "@/lib/server/backend-url";
import { nodeFetchBymedApi } from "@/lib/server/node-api-fetch";
import { joinUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(request: NextRequest, segments: string[] | undefined) {
  const apiBase = requireApiBaseUrl();
  const subPath = segments?.length ? segments.join("/") : "";
  const path = subPath ? `/${subPath}` : "/";
  const search = request.nextUrl.search;
  const target = `${joinUrl(apiBase, path)}${search}`;

  const access = request.cookies.get(BYMED_ACCESS_COOKIE)?.value;

  const headers = new Headers();
  const skip = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
  ]);

  request.headers.forEach((value, key) => {
    if (!skip.has(key.toLowerCase())) headers.set(key, value);
  });

  if (access) headers.set("Authorization", `Bearer ${access}`);
  else headers.delete("Authorization");

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await nodeFetchBymedApi(target, {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
    redirect: "manual",
  });

  const outHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) outHeaders.set("content-type", ct);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

export async function GET(
  request: NextRequest,
  ctx: { params: { path?: string[] } },
) {
  return proxy(request, ctx.params.path);
}

export async function POST(
  request: NextRequest,
  ctx: { params: { path?: string[] } },
) {
  return proxy(request, ctx.params.path);
}

export async function PUT(
  request: NextRequest,
  ctx: { params: { path?: string[] } },
) {
  return proxy(request, ctx.params.path);
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: { path?: string[] } },
) {
  return proxy(request, ctx.params.path);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: { path?: string[] } },
) {
  return proxy(request, ctx.params.path);
}

export async function HEAD(
  request: NextRequest,
  ctx: { params: { path?: string[] } },
) {
  return proxy(request, ctx.params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
