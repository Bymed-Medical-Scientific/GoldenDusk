import * as http from "node:http";
import * as https from "node:https";
import { URL } from "node:url";

/**
 * Node (Next server) → Bymed.API. Browsers use normal `fetch` + public URL.
 * ASP.NET dev HTTPS uses a cert Node does not trust; in development we relax TLS for
 * localhost HTTPS only (opt out with BYMED_STRICT_DEV_TLS=1).
 */
export function isDevLocalHttpsBymedApi(url: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.BYMED_STRICT_DEV_TLS !== "1" &&
    /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)
  );
}

function requestWithNode(
  urlStr: string,
  init: RequestInit | undefined,
  rejectUnauthorized: boolean,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const isHttps = u.protocol === "https:";
    const lib = isHttps ? https : http;
    const defaultPort = isHttps ? "443" : "80";
    const port = u.port || defaultPort;
    const method = (init?.method ?? "GET").toUpperCase();
    const headerObj = new Headers(init?.headers);

    const options: http.RequestOptions = {
      hostname: u.hostname,
      port,
      path: `${u.pathname}${u.search}`,
      method,
      headers: Object.fromEntries(headerObj.entries()),
    };
    if (isHttps) {
      (options as https.RequestOptions).rejectUnauthorized = rejectUnauthorized;
    }

    const req = lib.request(options, (incoming) => {
      const chunks: Buffer[] = [];
      incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
      incoming.on("end", () => {
        const buf = Buffer.concat(chunks);
        const outHeaders = new Headers();
        for (const [key, value] of Object.entries(incoming.headers)) {
          if (value === undefined) continue;
          if (Array.isArray(value)) {
            for (const v of value) outHeaders.append(key, v);
          } else {
            outHeaders.set(key, value);
          }
        }
        resolve(
          new Response(buf, {
            status: incoming.statusCode ?? 0,
            statusText: incoming.statusMessage,
            headers: outHeaders,
          }),
        );
      });
    });
    req.on("error", reject);

    const body = init?.body;
    if (body == null) {
      req.end();
      return;
    }
    if (typeof body === "string") {
      req.write(body);
      req.end();
      return;
    }
    if (body instanceof Uint8Array) {
      req.end(Buffer.from(body));
      return;
    }
    reject(
      new TypeError(
        "nodeFetchBymedApi (dev TLS bypass) supports string or Uint8Array body only.",
      ),
    );
  });
}

/** Use for every server-side request to Bymed.API (SSR, route handlers, proxy). */
export async function nodeFetchBymedApi(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (!isDevLocalHttpsBymedApi(url)) {
    return fetch(url, init ?? {});
  }

  const rest = { ...(init ?? {}) } as Record<string, unknown>;
  delete rest.next;
  return requestWithNode(url, rest as RequestInit, false);
}
