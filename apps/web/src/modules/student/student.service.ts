import { upsertStudentProfileAndSyncRoster } from "@/lib/server/services/student-sync";
import { studentRepository } from "@/modules/student/student.repository";
import { erpStudentUpsertSchema } from "@schoolconnect/shared";

export const studentService = {
  async list(input: {
    schoolId: string;
    q?: string;
    status?: string;
    className?: string;
  }) {
    const rows = await studentRepository.listBySchool(input);
    return rows.map((r) => studentRepository.toClient(r));
  },

  async get(id: string, schoolId: string) {
    const row = await studentRepository.findByIdInSchool(id, schoolId);
    return row ? studentRepository.toClient(row) : null;
  },

  async create(schoolId: string, body: unknown) {
    const parsed = erpStudentUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid body" as const };
    }
    const data = parsed.data;
    const profile = await upsertStudentProfileAndSyncRoster({
      schoolId,
      name: data.name,
      className: data.className || "",
      classSectionId: data.classSectionId,
      rollNo: data.rollNo,
      userId: data.userId,
      admissionNo: data.admissionNo,
      guardians: data.guardians,
      status: data.status || "enrolled",
      academicYear: data.academicYear,
    });
    if (data.dob !== undefined) profile.dob = data.dob;
    if (data.gender !== undefined) profile.gender = data.gender;
    if (data.bloodGroup !== undefined) profile.bloodGroup = data.bloodGroup;
    if (data.address !== undefined) profile.address = data.address;
    if (data.note !== undefined) profile.note = data.note;
    await profile.save();
    return { student: studentRepository.toClient(profile) };
  },

  async update(id: string, schoolId: string, body: unknown) {
    const existing = await studentRepository.findByIdInSchool(id, schoolId);
    if (!existing) return { error: "Student not found" as const, status: 404 };

    const parsed = erpStudentUpsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid body" as const };
    }
    const data = parsed.data;
    const profile = await upsertStudentProfileAndSyncRoster({
      schoolId,
      name: data.name ?? existing.name,
      className: data.className ?? existing.className ?? "",
      classSectionId: data.classSectionId ?? existing.classSectionId ?? undefined,
      rollNo: data.rollNo ?? existing.rollNo,
      userId: data.userId ?? existing.userId,
      admissionNo: data.admissionNo ?? existing.admissionNo ?? undefined,
      guardians: data.guardians,
      status:
        (data.status as
          | "prospect"
          | "enrolled"
          | "alumni"
          | "left"
          | "inactive") ||
        (existing.status as
          | "prospect"
          | "enrolled"
          | "alumni"
          | "left"
          | "inactive"),
      academicYear: data.academicYear ?? existing.academicYear,
      existingProfileId: existing._id,
    });
    if (data.dob !== undefined) profile.dob = data.dob;
    if (data.gender !== undefined) profile.gender = data.gender;
    if (data.bloodGroup !== undefined) profile.bloodGroup = data.bloodGroup;
    if (data.address !== undefined) profile.address = data.address;
    if (data.note !== undefined) profile.note = data.note;
    await profile.save();
    return { student: studentRepository.toClient(profile) };
  },
};
