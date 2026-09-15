import {
  AdmissionApplication,
  nextApplicationNo,
} from "@/lib/models/erp/AdmissionApplication";
import { ClassModel } from "@/lib/models/core/Class";
import { School } from "@/lib/models/core/School";
import { User } from "@/lib/models/core/User";
import {
  enrollmentToClient,
  StudentEnrollment,
} from "@/lib/models/core/StudentEnrollment";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import { isSchoolAdminRole } from "@/lib/shared/roles";

import { parseClassLabel } from "@/lib/shared/class-utils";

export async function GET() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const filter: Record<string, unknown> = {};
  if (user.role === "class_teacher") {
    filter.className = user.className;
    filter.schoolId = user.schoolId;
  } else if (isSchoolAdminRole(user.role) || user.role === "principal") {
    if (user.role !== "super_admin" && user.schoolId) {
      filter.schoolId = user.schoolId;
    }
  } else {
    return jsonError("Forbidden", 403);
  }

  const list = await StudentEnrollment.find(filter)
    .sort({ createdAt: -1 })
    .limit(200);
  return jsonOk({ enrollments: list.map(enrollmentToClient) });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "class_teacher",
    "principal",
  ]);
  if (error || !user) return error!;

  const body = (await req.json()) as {
    studentName?: string;
    identifier?: string;
    className?: string;
    note?: string;
  };

  const studentName = (body.studentName || "").trim();
  const classRaw = (body.className || user.className || "").trim();
  if (!studentName || !classRaw) {
    return jsonError("studentName and className are required");
  }
  if (!user.schoolId) {
    return jsonError("User must belong to a school", 400);
  }

  const parsed = parseClassLabel(classRaw);
  let classDoc = await ClassModel.findOne({
    schoolId: user.schoolId,
    className: parsed.className,
  });
  if (!classDoc) {
    classDoc = await ClassModel.create({
      schoolId: user.schoolId,
      grade: parsed.grade,
      section: parsed.section,
      className: parsed.className,
    });
  }

  const identifier = body.identifier?.trim().toLowerCase();
  const enrollment = await StudentEnrollment.create({
    studentName,
    identifier,
    schoolId: user.schoolId,
    schoolName: user.schoolName,
    className: parsed.className,
    section: parsed.section,
    classId: classDoc._id,
    status: "pending",
    addedById: user._id,
    addedByName: user.name,
    addedByRole: user.role,
    note: body.note?.trim(),
  });

  if (identifier) {
    const student = await User.findOne({ identifier, role: "student" });
    if (student) {
      enrollment.studentUserId = student._id;
      await enrollment.save();
    }
  }

  await AdmissionApplication.create({
    schoolId: user.schoolId,
    applicationNo: nextApplicationNo(
      (await School.findById(user.schoolId))?.code || "APP",
      (await AdmissionApplication.countDocuments({ schoolId: user.schoolId })) +
        1,
    ),
    studentName,
    identifier,
    applyingClassName: parsed.className,
    section: parsed.section,
    status: "submitted",
    enrollmentId: enrollment._id,
    applicantUserId: user._id,
    note: body.note?.trim() || "",
    documents: [
      { key: "birth_cert", label: "Birth certificate", status: "pending" },
      { key: "photo", label: "Student photo", status: "pending" },
      { key: "address", label: "Address proof", status: "pending" },
      { key: "prev_school", label: "Previous school certificate", status: "pending" },
      { key: "parent_id", label: "Parent ID", status: "pending" },
      { key: "medical", label: "Medical certificate", status: "pending" },
    ],
  });

  return jsonOk({ enrollment: enrollmentToClient(enrollment) }, 201);
}
