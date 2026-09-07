import { jsonError, jsonOk } from "@/shared";
import { assertPermission, tenantSchoolId } from "@/shared/tenant/scope";
import { classService } from "@/modules/class/class.service";
import type { UserDoc } from "@/lib/models/core/User";

export const classController = {
  async list(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "class:read");
    if (denied) return denied;
    const url = new URL(req.url);
    const scope = tenantSchoolId(user, url.searchParams.get("schoolId"));
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);
    const classes = await classService.list(scope.schoolId);
    return jsonOk({ classes });
  },
};
