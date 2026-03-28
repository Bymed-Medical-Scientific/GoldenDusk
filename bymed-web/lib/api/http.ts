import { getPublicApiBaseUrl, getServerSideApiOrigin } from "@/lib/env";
import { joinUrl } from "@/lib/url";
import type { ApiValidationIssue } from "@/types/api-common";

const BYMED_BROWSER_PROXY_PREFIX = "/api/bymed";

/**
 * Guest flows keep `cart_session_id` on the API origin. Authenticated calls use the
 * Next.js BFF proxy so httpOnly access cookies can supply `Authorization`.
 */
function isDirectBrowserApiPath(path: string, method: string): boolean {
  if (typeof window === "undefined") return false;
  const base = path.split("?")[0];
  if (/\/Cart(\/|$)/i.test(base)) return true;
  if (/\/Payments\/orders\//i.test(base)) return true;
  if (method === "POST" && /\/Orders$/i.test(base)) return true;
  if (
    method === "GET" &&
    /^.+\/Orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      base,
    )
  ) {
    return true;
  }
  return false;
}

function resolveRequestUrl(path: string, method: string): string {
  const base =
    typeof window === "undefined"
      ? getServerSideApiOrigin()
      : getPublicApiBaseUrl();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. Set it for production builds (see .env.example).",
    );
  }
  if (typeof window === "undefined") {
    return joinUrl(base, path);
  }
  if (isDirectBrowserApiPath(path, method)) {
    return joinUrl(base, path);
  }
  return joinUrl("", joinUrl(BYMED_BROWSER_PROXY_PREFIX, path));
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly validationIssues?: ApiValidationIssue[];

  constructor(
    status: number,
    message: string,
    body?: unknown,
    validationIssues?: ApiValidationIssue[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.validationIssues = validationIssues;
  }
}

let accessTokenGetter: () => string | null | Promise<string | null> = () => null;

export function setBymedAccessTokenGetter(
  getter: () => string | null | Promise<string | null>,
): void {
  accessTokenGetter = getter;
}

async function resolveAccessToken(): Promise<string | null> {
  try {
    const t = await accessTokenGetter();
    return t?.trim() || null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

function isLikelyNetworkError(e: unknown): boolean {
  return e instanceof TypeError;
}

function extractValidationIssues(body: unknown): ApiValidationIssue[] | undefined {
  if (!body || typeof body !== "object") return undefined;
  const raw = (body as { errors?: unknown }).errors;
  if (!Array.isArray(raw)) return undefined;
  const out: ApiValidationIssue[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "propertyName" in item &&
      "errorMessage" in item &&
      typeof (item as ApiValidationIssue).propertyName === "string" &&
      typeof (item as ApiValidationIssue).errorMessage === "string"
    ) {
      out.push({
        propertyName: (item as ApiValidationIssue).propertyName,
        errorMessage: (item as ApiValidationIssue).errorMessage,
      });
    }
  }
  return out.length ? out : undefined;
}

async function throwApiError(res: Response): Promise<never> {
  let body: unknown;
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      const text = await res.text();
      body = text || undefined;
    }
  } catch {
    body = undefined;
  }

  let message = res.statusText || `HTTP ${res.status}`;
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) message = err;
  } else if (typeof body === "string" && body.trim()) {
    message = body;
  }

  throw new ApiError(
    res.status,
    message,
    body,
    extractValidationIssues(body),
  );
}

export type ApiFetchOptions = {
  /** When false, disables retry (default: true for GET/HEAD/OPTIONS). */
  retry?: boolean;
  /** Max retries after the first attempt (default 3) for idempotent requests. */
  maxRetries?: number;
  /** Omit Authorization header (e.g. login). */
  skipAuth?: boolean;
  /** Browser/server cache mode forwarded to fetch. */
  cache?: RequestCache;
  /** Next.js data cache controls (server-side fetch only). */
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const url = resolveRequestUrl(path, method);
  const idempotent = ["GET", "HEAD", "OPTIONS"].includes(method);
  const allowRetry = options.retry !== false && idempotent;
  const maxRetries = options.maxRetries ?? 3;
  const maxAttempts = allowRetry ? maxRetries + 1 : 1;

  const useProxy =
    typeof window !== "undefined" && !isDirectBrowserApiPath(path, method);

  const headers = new Headers(init.headers);
  if (!options.skipAuth && !useProxy) {
    const token = await resolveAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    init.body != null &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let lastNetworkError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { next: _dropInitNext, ...initRest } = init as RequestInit & {
        next?: unknown;
      };
      const requestInit: RequestInit = {
        ...initRest,
        headers,
        credentials: "include",
      };
      if (options.cache != null) requestInit.cache = options.cache;

      const withNext =
        typeof window === "undefined" && options.next
          ? { ...requestInit, next: options.next }
          : requestInit;

      let res: Response;
      if (typeof window === "undefined") {
        const { nodeFetchBymedApi } = await import("@/lib/server/node-api-fetch");
        res = await nodeFetchBymedApi(url, withNext);
      } else {
        res = await fetch(url, withNext);
      }

      if (
        allowRetry &&
        attempt < maxAttempts - 1 &&
        (res.status === 502 || res.status === 503 || res.status === 504)
      ) {
        await sleep(backoffMs(attempt));
        continue;
      }

      return res;
    } catch (e) {
      lastNetworkError = e;
      if (allowRetry && attempt < maxAttempts - 1 && isLikelyNetworkError(e)) {
        await sleep(backoffMs(attempt));
        continue;
      }
      throw e;
    }
  }

  throw lastNetworkError;
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function readJson<T>(
  res: Response,
  okStatuses: number[] = [200, 201],
): Promise<T> {
  if (!okStatuses.includes(res.status) && res.status !== 204) {
    await throwApiError(res);
  }
  return parseJsonResponse<T>(res);
}

export async function readTextResponse(res: Response): Promise<string> {
  if (!res.ok) await throwApiError(res);
  return res.text();
}
