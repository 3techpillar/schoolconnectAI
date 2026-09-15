import { Exam, examToClient } from "@/lib/models/erp/Exam";
import { ExamMark, examMarkToClient } from "@/lib/models/erp/ExamMark";
import {
  StudentProfile,
  studentProfileToClient,
} from "@/lib/models/erp/StudentProfile";
import { School, schoolToClient } from "@/lib/models/core/School";
import {
  StaffProfile,
  staffProfileToClient,
} from "@/lib/models/erp/StaffProfile";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireErpUser, resolveErpSchoolId } from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import mongoose from "mongoose";

/** ID cards + report card printable payloads. */
export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const kind = url.searchParams.get("kind") || "students";
  const school = await School.findById(scope.schoolId);
  if (!school) return jsonError("School not found", 404);

  if (kind === "report") {
    const examId = url.searchParams.get("examId");
    const studentProfileId = url.searchParams.get("studentProfileId");
    if (
      !examId ||
      !studentProfileId ||
      !mongoose.Types.ObjectId.isValid(examId) ||
      !mongoose.Types.ObjectId.isValid(studentProfileId)
    ) {
      return jsonError("examId and studentProfileId required");
    }
    const exam = await Exam.findById(examId);
    const student = await StudentProfile.findById(studentProfileId);
    if (!exam || !student) return jsonError("Not found", 404);
    const marks = await ExamMark.find({
      examId,
      studentProfileId,
    });
    const totalMax = marks.reduce((s, m) => s + (m.maxMarks || 0), 0);
    const totalGot = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
    const pct =
      totalMax > 0 ? Math.round((totalGot / totalMax) * 1000) / 10 : 0;
    return jsonOk({
      school: schoolToClient(school),
      exam: examToClient(exam),
      student: studentProfileToClient(student),
      marks: marks.map(examMarkToClient),
      summary: {
        totalMax,
        totalGot,
        percentage: pct,
        result: pct >= 40 ? "Pass" : "Fail",
      },
    });
  }

  if (kind === "staff") {
    const staff = await StaffProfile.find({
      schoolId: scope.schoolId,
      status: "active",
    })
      .sort({ name: 1 })
      .limit(200);
    return jsonOk({
      school: schoolToClient(school),
      staff: staff.map(staffProfileToClient),
    });
  }

  const className = url.searchParams.get("className");
  const filter: Record<string, unknown> = {
    schoolId: scope.schoolId,
    status: "enrolled",
  };
  if (className) filter.className = className;
  const students = await StudentProfile.find(filter)
    .sort({ className: 1, rollNo: 1 })
    .limit(500);

  return jsonOk({
    school: schoolToClient(school),
    students: students.map(studentProfileToClient),
  });
});
