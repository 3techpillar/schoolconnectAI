import { jsonOk } from "@/shared";
import { assertPermission } from "@/shared/tenant/scope";
import { userService } from "@/modules/user/user.service";
import type { UserDoc } from "@/lib/models/core/User";

export const userController = {
  async list(_req: Request, user: UserDoc) {
    const denied = assertPermission(user, "user:read");
    if (denied) return denied;
    const users = await userService.directory(user);
    return jsonOk({ users });
  },
};
