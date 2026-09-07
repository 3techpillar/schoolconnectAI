import {
  enrollmentToClient,
  StudentEnrollment,
} from "@/lib/models/core/StudentEnrollment";
import { AdmissionApplication } from "@/lib/models/erp/AdmissionApplication";
import { User } from "@/lib/models/core/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import { ensureProfilesForEnrollment } from "@/lib/server/services/student-sync";
import { isSchoolAdminRole } from "@/lib/shared/roles";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "class_teacher",
    "principal",
  ]);
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid enrollment id");
  }

  const body = (await req.json()) as {
    status?: "approved" | "rejected";
    note?: string;
  };
  if (!body.status || !["approved", "rejected"].includes(body.status)) {
    return jsonError("status must be approved or rejected");
  }

  const enrollment = await StudentEnrollment.findById(id);
  if (!enrollment) return jsonError("Enrollment not found", 404);

  if (
    user.role === "class_teacher" &&
    (String(enrollment.schoolId) !== String(user.schoolId) ||
      enrollment.className !== user.className)
  ) {
    return jsonError("Forbidden", 403);
  }
  if (
    isSchoolAdminRole(user.role) &&
    user.role !== "super_admin" &&
    String(enrollment.schoolId) !== String(user.schoolId)
  ) {
    return jsonError("Forbidden", 403);
  }

  enrollment.status = body.status;
  enrollment.reviewedAt = new Date();
  enrollment.reviewedByName = user.name;
  if (body.note?.trim()) enrollment.note = body.note.trim();
  await enrollment.save();

  let studentUserId = enrollment.studentUserId;
  if (enrollment.studentUserId) {
    await User.findByIdAndUpdate(enrollment.studentUserId, {
      enrollmentStatus: body.status,
      className: enrollment.className,
      classId: enrollment.classId,
      schoolId: enrollment.schoolId,
      schoolName: enrollment.schoolName,
    });
  } else if (enrollment.identifier) {
    const updated = await User.findOneAndUpdate(
      { identifier: enrollment.identifier, role: "student" },
      {
        enrollmentStatus: body.status,
        className: enrollment.className,
        classId: enrollment.classId,
        schoolId: enrollment.schoolId,
        schoolName: enrollment.schoolName,
      },
      { new: true },
    );
    if (updated) {
      studentUserId = updated._id;
      enrollment.studentUserId = updated._id;
      await enrollment.save();
    }
  }

  let studentProfileId: string | undefined;
  if (body.status === "approved") {
    const profile = await ensureProfilesForEnrollment({
      schoolId: enrollment.schoolId,
      studentName: enrollment.studentName,
      className: enrollment.className,
      classId: enrollment.classId,
      studentUserId,
    });
    studentProfileId = String(profile._id);

    await AdmissionApplication.findOneAndUpdate(
      { enrollmentId: enrollment._id },
      {
        $set: {
          status: "enrolled",
          studentProfileId: profile._id,
          reviewedByName: user.name,
          reviewedAt: new Date(),
        },
      },
    );
  } else {
    await AdmissionApplication.findOneAndUpdate(
      { enrollmentId: enrollment._id },
      {
        $set: {
          status: "rejected",
          reviewedByName: user.name,
          reviewedAt: new Date(),
          note: body.note?.trim() || "",
        },
      },
    );
  }

  return jsonOk({
    enrollment: enrollmentToClient(enrollment),
    studentProfileId,
  });
}
