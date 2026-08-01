import {
  enrollmentToClient,
  StudentEnrollment,
  type StudentEnrollmentDoc,
} from "@/lib/models/StudentEnrollment";
import { User } from "@/lib/models/User";
import { parseClassLabel } from "@/lib/shared/class-utils";

type UserInstance = InstanceType<typeof User>;

/**
 * Idempotent: ensure a StudentEnrollment row exists for a self-registered student.
 */
export async function ensureStudentEnrollmentForUser(user: UserInstance) {
  if (user.role !== "student") {
    return { enrollment: null as StudentEnrollmentDoc | null, created: false };
  }
  if (!user.schoolId) {
    throw new Error("Student has no school");
  }

  const identifier = user.identifier.toLowerCase();
  const existing = await StudentEnrollment.findOne({
    $or: [
      { studentUserId: user._id, status: { $ne: "rejected" } },
      { identifier, schoolId: user.schoolId, status: { $ne: "rejected" } },
    ],
  }).sort({ createdAt: -1 });

  if (existing) {
    let dirty = false;
    if (!existing.studentUserId) {
      existing.studentUserId = user._id;
      dirty = true;
    }
    if (existing.studentName !== user.name) {
      existing.studentName = user.name;
      dirty = true;
    }
    if (existing.identifier !== identifier) {
      existing.identifier = identifier;
      dirty = true;
    }
    if (dirty) await existing.save();

    if (
      existing.status === "approved" &&
      user.enrollmentStatus !== "approved"
    ) {
      user.enrollmentStatus = "approved";
      await user.save();
    }
    return { enrollment: existing, created: false };
  }

  const parsed = parseClassLabel(user.className || "6-B");
  const enrollment = await StudentEnrollment.create({
    studentName: user.name,
    identifier,
    schoolId: user.schoolId,
    schoolName: user.schoolName,
    className: parsed.className,
    section: parsed.section,
    classId: user.classId,
    status: "pending",
    addedById: user._id,
    addedByName: user.name,
    addedByRole: "student",
    studentUserId: user._id,
    note: "Self registration",
  });

  return { enrollment, created: true };
}

export function enrollmentClient(e: StudentEnrollmentDoc) {
  return enrollmentToClient(e);
}
