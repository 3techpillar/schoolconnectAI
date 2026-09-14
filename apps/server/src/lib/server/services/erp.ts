import { ErpAuditLog } from "@/lib/models/erp/ErpAuditLog";
import { School } from "@/lib/models/core/School";
import type { UserDoc } from "@/lib/models/core/User";
import { jsonError } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import { canAccessErp, isSuperAdminRole } from "@/lib/shared/roles";
import { isSubscriptionActive, schoolHasModule } from "@schoolconnect/shared";
import { tenantSchoolId } from "@/shared/tenant/scope";
import type { Types } from "mongoose";

export const ERP_ROLES = [
  "admin",
  "super_admin",
  "principal",
  "accountant",
] as const;

export async function requireErpUser() {
  const result = await requireUser([...ERP_ROLES]);
  if (result.error || !result.user) return result;
  if (!canAccessErp(result.user.role)) {
    return {
      error: jsonError("Forbidden", 403),
      session: result.session,
      user: null,
    };
  }

  // Super Admin may always manage ERP (onboard / switch product modes).
  if (!isSuperAdminRole(result.user.role)) {
    const schoolId = result.user.schoolId;
    if (!schoolId) {
      return {
        error: jsonError("ERP not enabled for this school", 403),
        session: result.session,
        user: null,
      };
    }
    const school = await School.findById(schoolId);
    if (!school || !schoolHasModule(school, "erp")) {
      return {
        error: jsonError("ERP not enabled for this school", 403),
        session: result.session,
        user: null,
      };
    }
    if (!isSubscriptionActive(school)) {
      return {
        error: jsonError(
          "School subscription expired. Ask Super Admin to extend the free/paid end date.",
          403,
        ),
        session: result.session,
        user: null,
      };
    }
  }

  return result;
}

/** Prefer shared tenant helper for schoolId isolation. */
export function resolveErpSchoolId(
  user: UserDoc,
  requestedSchoolId?: string | null,
) {
  return tenantSchoolId(user, requestedSchoolId);
}

export async function writeErpAudit(input: {
  user: UserDoc;
  schoolId?: Types.ObjectId | string | null;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await ErpAuditLog.create({
      schoolId: input.schoolId || undefined,
      actorUserId: input.user._id,
      actorName: input.user.name,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || "",
      meta: input.meta || {},
    });
  } catch (err) {
    console.error("[erp-audit]", err);
  }
}
