import { jsonError, jsonOk } from "@/shared";
import { assertPermission, tenantSchoolId } from "@/shared/tenant/scope";
import { leaveService } from "@/modules/leave/leave.service";
import type { UserDoc } from "@/lib/models/core/User";
import { writeErpAudit } from "@/lib/server/services/erp";

export const leaveController = {
  async list(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "leave:read");
    if (denied) return denied;
    const url = new URL(req.url);
    const scope = tenantSchoolId(user, url.searchParams.get("schoolId"));
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);
    const leaves = await leaveService.list(
      scope.schoolId,
      url.searchParams.get("status"),
    );
    return jsonOk({ leaves });
  },

  async review(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "leave:review");
    if (denied) return denied;
    const body = (await req.json()) as {
      id?: string;
      status?: "approved" | "rejected";
      note?: string;
      schoolId?: string;
    };
    if (!body.id || !body.status) return jsonError("id and status required");

    const scope = tenantSchoolId(user, body.schoolId);
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);

    const result = await leaveService.review(body.id, scope.schoolId, {
      status: body.status,
      note: body.note,
      reviewerName: user.name,
    });
    if ("error" in result && result.error) {
      return jsonError(result.error, "status" in result ? result.status : 400);
    }
    await writeErpAudit({
      user,
      schoolId: scope.schoolId,
      action: body.status,
      entityType: "Leave",
      entityId: body.id,
    });
    return jsonOk(result);
  },
};
