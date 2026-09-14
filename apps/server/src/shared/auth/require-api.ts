import { requireUser } from "@/lib/server/http";
import type { Role } from "@schoolconnect/shared";

/** Authenticated API context for /api/v1 handlers. */
export async function requireApiUser(roles?: Role[]) {
  return requireUser(roles);
}
