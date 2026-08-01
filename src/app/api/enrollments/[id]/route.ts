import {
  enrollmentToClient,
  StudentEnrollment,
} from "@/lib/models/StudentEnrollment";
import { User } from "@/lib/models/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
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

  if (enrollment.studentUserId) {
    await User.findByIdAndUpdate(enrollment.studentUserId, {
      enrollmentStatus: body.status,
      className: enrollment.className,
      schoolId: enrollment.schoolId,
      schoolName: enrollment.schoolName,
    });
  } else if (enrollment.identifier) {
    await User.findOneAndUpdate(
      { identifier: enrollment.identifier, role: "student" },
      {
        enrollmentStatus: body.status,
        className: enrollment.className,
        schoolId: enrollment.schoolId,
        schoolName: enrollment.schoolName,
      },
    );
  }

  return jsonOk({ enrollment: enrollmentToClient(enrollment) });
}
