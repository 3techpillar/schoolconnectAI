import {
  StudentProfile,
  studentProfileToClient,
  type StudentProfileDoc,
} from "@/modules/student/student.model";
import { withTenantFilter } from "@/shared/tenant/scope";
import type { Types } from "mongoose";

export const studentRepository = {
  async listBySchool(input: {
    schoolId: string;
    q?: string;
    status?: string;
    className?: string;
    limit?: number;
  }) {
    const filter = withTenantFilter(input.schoolId, {} as Record<string, unknown>);
    if (input.status) filter.status = input.status;
    if (input.className) filter.className = input.className;
    if (input.q) {
      filter.$or = [
        { name: { $regex: input.q, $options: "i" } },
        { admissionNo: { $regex: input.q, $options: "i" } },
        { rollNo: { $regex: input.q, $options: "i" } },
        { studentId: { $regex: input.q, $options: "i" } },
      ];
    }
    return StudentProfile.find(filter)
      .sort({ className: 1, rollNo: 1, name: 1 })
      .limit(input.limit ?? 500);
  },

  async findByIdInSchool(id: string, schoolId: string) {
    return StudentProfile.findOne({ _id: id, schoolId });
  },

  async findByUserId(schoolId: string, userId: Types.ObjectId | string) {
    return StudentProfile.findOne({ schoolId, userId });
  },

  toClient(doc: StudentProfileDoc) {
    return studentProfileToClient(doc);
  },
};
