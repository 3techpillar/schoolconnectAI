import type { UserDoc } from "@/lib/models/core/User";
import { jsonError } from "@/lib/server/auth";
import { isSuperAdminRole } from "@/lib/shared/roles";
import type { Permission } from "@/shared/rbac/permissions";
import { requirePermissions } from "@/shared/rbac/permissions";
import mongoose from "mongoose";

/**
 * Tenant isolation: never query school data without schoolId
 * (except super_admin with explicit multi-tenant tools).
 */
export function tenantSchoolId(
  user: UserDoc,
  requestedSchoolId?: string | null,
): { schoolId: string | null; error: Response | null } {
  if (isSuperAdminRole(user.role)) {
    if (requestedSchoolId) {
      if (!mongoose.Types.ObjectId.isValid(requestedSchoolId)) {
        return { schoolId: null, error: jsonError("Invalid schoolId", 400) };
      }
      return { schoolId: requestedSchoolId, error: null };
    }
    if (user.schoolId) return { schoolId: String(user.schoolId), error: null };
    return { schoolId: null, error: null };
  }

  if (!user.schoolId) {
    return { schoolId: null, error: jsonError("No school assigned", 400) };
  }
  const own = String(user.schoolId);
  if (requestedSchoolId && requestedSchoolId !== own) {
    return { schoolId: null, error: jsonError("Forbidden: tenant mismatch", 403) };
  }
  return { schoolId: own, error: null };
}

/** Always scope Mongo filters with schoolId when present. */
export function withTenantFilter<T extends Record<string, unknown>>(
  schoolId: string | null,
  filter: T = {} as T,
): T & { schoolId?: string } {
  if (!schoolId) return filter;
  return { ...filter, schoolId };
}

export function assertPermission(
  user: UserDoc,
  ...permissions: Permission[]
): Response | null {
  if (!requirePermissions(user.role, ...permissions)) {
    return jsonError("Forbidden", 403);
  }
  return null;
}
