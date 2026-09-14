import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

/**
 * Creates a standard Web Request object from an Express Request.
 */
export function createWebRequest(req: ExpressRequest): Request {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:4000";
  const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value !== undefined) {
      headers.append(key, value);
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    // If body was parsed by express.json(), stringify it.
    // If it's a raw buffer, use it directly.
    if (req.body && typeof req.body === "object") {
      init.body = JSON.stringify(req.body);
    } else if (req.body) {
      init.body = req.body;
    }
  }

  const webReq = new Request(url.toString(), init);
  
  // Attach Express req/res to a custom property for mock access
  (webReq as any)._expressReq = req;
  (webReq as any)._expressRes = res;
  
  return webReq;
}

/**
 * Sends a standard Web Response via an Express Response.
 */
export async function sendWebResponse(res: ExpressResponse, webRes: Response) {
  res.status(webRes.status);
  
  webRes.headers.forEach((value, key) => {
    // Ignore set-cookie here, as it might be handled differently or we can pass it through
    if (key.toLowerCase() === 'set-cookie') {
        const existing = res.getHeader('Set-Cookie');
        let combined: string[] = [];
        if (Array.isArray(existing)) {
            combined = [...existing];
        } else if (existing) {
            combined = [String(existing)];
        }
        combined.push(value);
        res.setHeader('Set-Cookie', combined);
    } else {
        res.setHeader(key, value);
    }
  });

  const body = await webRes.text();
  res.send(body);
}

/**
 * Wraps a Next.js App Router API handler to work with Express.
 */
export function wrapNextRoute(
  handler?: (req: Request, context: { params: Record<string, string | string[]> }) => Promise<Response> | Response
) {
  if (!handler) {
    return (req: ExpressRequest, res: ExpressResponse) => {
      res.status(405).json({ ok: false, error: "Method Not Allowed" });
    };
  }

  const wrapper = async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const webReq = createWebRequest(req);
      const context = { params: req.params };
      
      return await asyncLocalStorage.run({ req, res }, async () => {
        const webRes = await handler(webReq, context);
        await sendWebResponse(res, webRes);
      });
    } catch (err) {
      console.error("[express-wrapper]", err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: "Internal server error" });
      }
    }
  };
  (wrapper as any).isWrapped = true;
  return wrapper;
}

import { AsyncLocalStorage } from "async_hooks";
export const asyncLocalStorage = new AsyncLocalStorage<{req: ExpressRequest, res: ExpressResponse}>();
