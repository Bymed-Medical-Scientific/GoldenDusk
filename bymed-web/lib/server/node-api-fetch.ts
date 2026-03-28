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

/** Bodies we can send through the Node http(s) client (avoids Next.js patched `fetch`). */
function canSendBodyWithNode(body: RequestInit["body"]): boolean {
  if (body == null) return true;
  if (typeof body === "string") return true;
  if (body instanceof Uint8Array) return true;
  return false;
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
      incoming.on("error", reject);
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
        "nodeFetchBymedApi supports null, string, or Uint8Array body; use native fetch for FormData/Blob/streams.",
      ),
    );
  });
}

/**
 * Server-side calls to Bymed.API.
 *
 * Next.js patches global `fetch` and ties it to the RSC / static render lifecycle. When a
 * render is discarded, that `fetch` is aborted — the API sees `RequestAborted` and EF throws
 * `OperationCanceledException`. Using Node's http(s) client avoids that patched `fetch`
 * for typical JSON bodies while preserving dev TLS relaxation for localhost HTTPS.
 */
export async function nodeFetchBymedApi(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const rest = { ...(init ?? {}) } as Record<string, unknown>;
  delete rest.next;

  const initForNode = rest as RequestInit;
  if (!canSendBodyWithNode(initForNode.body)) {
    return fetch(url, initForNode);
  }

  const rejectUnauthorized = !isDevLocalHttpsBymedApi(url);
  return requestWithNode(url, initForNode, rejectUnauthorized);
}
