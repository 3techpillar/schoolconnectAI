import { ClassDesk } from "@/modules/attendance/attendance.model";
import { withTenantFilter } from "@/shared/tenant/scope";

export const attendanceRepository = {
  async desksBySchool(schoolId: string) {
    return ClassDesk.find(withTenantFilter(schoolId)).limit(100);
  },
};
