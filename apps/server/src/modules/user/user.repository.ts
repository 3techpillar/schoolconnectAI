import { User, userToClient } from "@/modules/user/user.model";
import { withTenantFilter } from "@/shared/tenant/scope";
import { isSuperAdminRole } from "@/lib/shared/roles";
import type { UserDoc } from "@/lib/models/core/User";

export const userRepository = {
  async listDirectory(actor: UserDoc) {
    const filter = isSuperAdminRole(actor.role)
      ? {}
      : withTenantFilter(actor.schoolId ? String(actor.schoolId) : null);
    return User.find(filter).sort({ name: 1 }).limit(500);
  },
  toClient: userToClient,
};
