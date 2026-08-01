import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getJwtSecret } from "@/lib/server/secrets";
import type { Role } from "@/lib/shared/roles";

export { jsonError, jsonOk } from "@/lib/server/response";

export const AUTH_COOKIE = "sc_session";

export interface SessionPayload {
  sub: string;
  role: Role;
  schoolId?: string;
  enrollmentStatus?: "pending" | "approved" | "rejected";
}

function secretKey() {
  return getJwtSecret();
}

export async function signSession(payload: SessionPayload, days = 14) {
  return new SignJWT({
    role: payload.role,
    schoolId: payload.schoolId,
    enrollmentStatus: payload.enrollmentStatus,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  return {
    sub: String(payload.sub),
    role: payload.role as Role,
    schoolId: payload.schoolId ? String(payload.schoolId) : undefined,
    enrollmentStatus: payload.enrollmentStatus as
      | "pending"
      | "approved"
      | "rejected"
      | undefined,
  } satisfies SessionPayload;
}

export async function getSessionFromCookies() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest) {
  const token =
    req.cookies.get(AUTH_COOKIE)?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 14) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
