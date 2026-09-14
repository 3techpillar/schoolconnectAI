import { classRepository } from "@/modules/class/class.repository";

export const classService = {
  async list(schoolId: string) {
    const rows = await classRepository.listBySchool(schoolId);
    return rows.map((c) => classRepository.toClient(c));
  },
};
