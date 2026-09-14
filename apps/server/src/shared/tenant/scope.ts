import type { UserDoc } from "@/lib/models/core/User.js";
import { jsonError } from "@/lib/server/response.js";
import { isSuperAdminRole } from "@/lib/shared/roles.js";
import type { Permission } from "@/shared/rbac/permissions.js";
import { requirePermissions } from "@/shared/rbac/permissions.js";
import mongoose from "mongoose";

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
