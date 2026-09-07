import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Simple in-memory rate limit for OTP endpoints (per-instance). */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 20;

function clientKey(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin") || "*";
  const allowList = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowOrigin =
    allowList.includes("*") || allowList.includes(origin) ? origin : allowList[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin === "null" ? "*" : allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Requested-With, X-SC-Session",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  const authorization = req.headers.get("authorization");
  if (authorization) {
    requestHeaders.set("authorization", authorization);
  }
  const sessionHeader = req.headers.get("x-sc-session");
  if (sessionHeader) {
    requestHeaders.set("x-sc-session", sessionHeader);
  }

  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
    }
  }

  if (pathname.startsWith("/api/auth/otp")) {
    const key = `${clientKey(req)}:${pathname}`;
    const now = Date.now();
    const row = hits.get(key);
    if (!row || row.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      row.count += 1;
      if (row.count > MAX_HITS) {
        return NextResponse.json(
          { ok: false, error: "Too many requests. Try again shortly." },
          {
            status: 429,
            headers: {
              ...corsHeaders(req),
              "Retry-After": String(Math.ceil((row.resetAt - now) / 1000)),
            },
          },
        );
      }
    }
  }

  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    const cors = corsHeaders(req);
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
