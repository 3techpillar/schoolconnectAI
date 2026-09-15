import { School, schoolToClient } from "@/modules/school/school.model";
import { isSuperAdminRole } from "@/lib/shared/roles";
import type { UserDoc } from "@/lib/models/core/User";

export const schoolRepository = {
  async listForUser(user: UserDoc) {
    if (isSuperAdminRole(user.role)) {
      return School.find().sort({ name: 1 }).limit(200);
    }
    if (!user.schoolId) return [];
    const one = await School.findById(user.schoolId);
    return one ? [one] : [];
  },
  toClient: schoolToClient,
};
