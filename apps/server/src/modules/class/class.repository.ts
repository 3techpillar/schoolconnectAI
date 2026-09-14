import {
  ClassModel,
  classSectionToClient,
} from "@/modules/class/class.model";
import { withTenantFilter } from "@/shared/tenant/scope";

export const classRepository = {
  async listBySchool(schoolId: string) {
    const filter = withTenantFilter(schoolId);
    return ClassModel.find(filter).sort({ grade: 1, section: 1 }).limit(200);
  },
  toClient: classSectionToClient,
};
