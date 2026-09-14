import { jsonError, jsonOk } from "@/shared";
import { assertPermission, tenantSchoolId } from "@/shared/tenant/scope";
import { attendanceService } from "@/modules/attendance/attendance.service";
import type { UserDoc } from "@/lib/models/core/User";

export const attendanceController = {
  async summary(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "attendance:read");
    if (denied) return denied;
    const url = new URL(req.url);
    const scope = tenantSchoolId(user, url.searchParams.get("schoolId"));
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);
    const data = await attendanceService.todaySummary(
      scope.schoolId,
      url.searchParams.get("date") || undefined,
    );
    return jsonOk(data);
  },
};
