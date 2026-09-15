import { Leave, leaveToClient } from "@/modules/leave/leave.model";
import { withTenantFilter } from "@/shared/tenant/scope";

export const leaveRepository = {
  async listBySchool(schoolId: string, status?: string | null) {
    const filter = withTenantFilter(schoolId, {} as Record<string, unknown>);
    if (status) filter.status = status;
    return Leave.find(filter).sort({ appliedAt: -1 }).limit(200);
  },
  toClient: leaveToClient,
};
