import { jsonError, jsonOk } from "@/shared";
import { assertPermission, tenantSchoolId } from "@/shared/tenant/scope";
import { feeService } from "@/modules/fee/fee.service";
import type { UserDoc } from "@/lib/models/core/User";

export const feeController = {
  async list(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "fee:read");
    if (denied) return denied;
    const url = new URL(req.url);
    const scope = tenantSchoolId(user, url.searchParams.get("schoolId"));
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);
    const data = await feeService.overview(scope.schoolId);
    return jsonOk(data);
  },
};
