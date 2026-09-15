import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { getJwtSecret } from "@/lib/server/secrets.js";
import type { Role } from "@/lib/shared/roles.js";

export { jsonOk, jsonError } from "./response.js";

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

/** Extract session from cookie or Authorization/X-SC-Session headers */
export async function getSessionFromRequest(req: Request) {
  let token =
    req.cookies?.[AUTH_COOKIE] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    (req.headers["x-sc-session"] as string) ||
    undefined;

  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export const getSessionFromCookiesOrBearer = getSessionFromRequest;

export function sessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 14) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec * 1000, // Express cookie maxAge is in milliseconds
  };
}
