import { jsonOk } from "@/shared";
import { assertPermission } from "@/shared/tenant/scope";
import { schoolService } from "@/modules/school/school.service";
import type { UserDoc } from "@/lib/models/core/User";

export const schoolController = {
  async list(_req: Request, user: UserDoc) {
    const denied = assertPermission(user, "school:read");
    if (denied) return denied;
    const schools = await schoolService.list(user);
    return jsonOk({ schools });
  },
};
