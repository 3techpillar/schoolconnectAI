import { AUTH_COOKIE, jsonOk, sessionCookieOptions } from "@/lib/server/auth";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return jsonOk({ loggedOut: true });
}
