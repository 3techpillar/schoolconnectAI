import { userRepository } from "@/modules/user/user.repository";
import type { UserDoc } from "@/lib/models/core/User";

export const userService = {
  async directory(actor: UserDoc) {
    const rows = await userRepository.listDirectory(actor);
    return rows.map((u) => userRepository.toClient(u));
  },
};
