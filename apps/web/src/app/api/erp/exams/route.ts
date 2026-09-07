import { Exam, examToClient } from "@/lib/models/erp/Exam";
import {
  ExamMark,
  examMarkToClient,
  gradeFromPct,
} from "@/lib/models/erp/ExamMark";
import { StudentProfile } from "@/lib/models/erp/StudentProfile";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import {
  erpExamMarkUpsertSchema,
  erpExamUpsertSchema,
} from "@schoolconnect/shared";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const examId = url.searchParams.get("examId");
  if (examId) {
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return jsonError("Invalid examId");
    }
    const exam = await Exam.findById(examId);
    if (!exam) return jsonError("Exam not found", 404);
    const marks = await ExamMark.find({ examId }).limit(1000);
    return jsonOk({
      exam: examToClient(exam),
      marks: marks.map(examMarkToClient),
    });
  }

  const exams = await Exam.find({ schoolId: scope.schoolId })
    .sort({ createdAt: -1 })
    .limit(100);
  return jsonOk({ exams: exams.map(examToClient) });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action || "createExam");

  if (action === "upsertMark") {
    const parsed = erpExamMarkUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid body");
    }
    const data = parsed.data;
    const exam = await Exam.findById(data.examId);
    if (!exam) return jsonError("Exam not found", 404);
    const scope = resolveErpSchoolId(user, String(exam.schoolId));
    if (scope.error) return scope.error;

    const student = await StudentProfile.findById(data.studentProfileId);
    if (!student) return jsonError("Student not found", 404);

    const maxMarks = data.maxMarks ?? 100;
    const pct =
      maxMarks > 0
        ? Math.round((data.marksObtained / maxMarks) * 1000) / 10
        : 0;

    const mark = await ExamMark.findOneAndUpdate(
      {
        examId: data.examId,
        studentProfileId: data.studentProfileId,
        subjectName: data.subjectName,
      },
      {
        $set: {
          schoolId: exam.schoolId,
          examId: data.examId,
          studentProfileId: data.studentProfileId,
          studentName: student.name,
          className: student.className || exam.className,
          rollNo: student.rollNo || "",
          subjectCode: data.subjectCode || "",
          subjectName: data.subjectName,
          maxMarks,
          marksObtained: data.marksObtained,
          grade: gradeFromPct(pct),
          remarks: data.remarks || "",
          enteredByName: user.name,
        },
      },
      { upsert: true, new: true },
    );

    await writeErpAudit({
      user,
      schoolId: exam.schoolId,
      action: "upsertMark",
      entityType: "ExamMark",
      entityId: String(mark._id),
    });

    return jsonOk({ mark: examMarkToClient(mark) });
  }

  const parsed = erpExamUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  const scope = resolveErpSchoolId(user, data.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const exam = await Exam.create({
    schoolId: scope.schoolId,
    name: data.name,
    type: data.type || "custom",
    academicYear: data.academicYear || "2025-26",
    className: data.className || "",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    status: data.status || "scheduled",
    papers: data.papers || [],
  });

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "create",
    entityType: "Exam",
    entityId: String(exam._id),
  });

  return jsonOk({ exam: examToClient(exam) }, 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("id required");

  const exam = await Exam.findById(id);
  if (!exam) return jsonError("Exam not found", 404);
  const scope = resolveErpSchoolId(user, String(exam.schoolId));
  if (scope.error) return scope.error;

  const parsed = erpExamUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  if (data.name !== undefined) exam.name = data.name;
  if (data.type !== undefined) exam.type = data.type;
  if (data.academicYear !== undefined) exam.academicYear = data.academicYear;
  if (data.className !== undefined) exam.className = data.className;
  if (data.startDate !== undefined) exam.startDate = data.startDate;
  if (data.endDate !== undefined) exam.endDate = data.endDate;
  if (data.status !== undefined) exam.status = data.status;
  if (data.papers !== undefined) exam.papers = data.papers as typeof exam.papers;
  await exam.save();

  await writeErpAudit({
    user,
    schoolId: exam.schoolId,
    action: "update",
    entityType: "Exam",
    entityId: String(exam._id),
  });

  return jsonOk({ exam: examToClient(exam) });
});
