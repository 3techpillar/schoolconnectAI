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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/auth/otp")) {
    return NextResponse.next();
  }

  const key = `${clientKey(req)}:${pathname}`;
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }
  row.count += 1;
  if (row.count > MAX_HITS) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((row.resetAt - now) / 1000)),
        },
      },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/otp/:path*"],
};
