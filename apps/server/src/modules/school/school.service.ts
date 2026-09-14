import { schoolRepository } from "@/modules/school/school.repository";
import type { UserDoc } from "@/lib/models/core/User";

export const schoolService = {
  async list(user: UserDoc) {
    const rows = await schoolRepository.listForUser(user);
    return rows.map((s) => schoolRepository.toClient(s));
  },
};
