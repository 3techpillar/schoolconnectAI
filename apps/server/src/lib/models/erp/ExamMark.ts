import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExamMarkSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    className: { type: String, default: "" },
    rollNo: { type: String, default: "" },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, required: true },
    maxMarks: { type: Number, default: 100 },
    marksObtained: { type: Number, default: 0 },
    grade: { type: String, default: "" },
    remarks: { type: String, default: "" },
    enteredByName: { type: String, default: "" },
  },
  { timestamps: true },
);

ExamMarkSchema.index(
  { examId: 1, studentProfileId: 1, subjectName: 1 },
  { unique: true },
);

export type ExamMarkDoc = InferSchemaType<typeof ExamMarkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ExamMark: Model<ExamMarkDoc> =
  mongoose.models.ExamMark ||
  mongoose.model<ExamMarkDoc>("ExamMark", ExamMarkSchema);

export function examMarkToClient(m: ExamMarkDoc) {
  const pct =
    m.maxMarks > 0
      ? Math.round(((m.marksObtained || 0) / m.maxMarks) * 1000) / 10
      : 0;
  return {
    id: String(m._id),
    schoolId: String(m.schoolId),
    examId: String(m.examId),
    studentProfileId: String(m.studentProfileId),
    studentName: m.studentName,
    className: m.className || "",
    rollNo: m.rollNo || "",
    subjectCode: m.subjectCode || "",
    subjectName: m.subjectName,
    maxMarks: m.maxMarks ?? 100,
    marksObtained: m.marksObtained ?? 0,
    percentage: pct,
    grade: m.grade || gradeFromPct(pct),
    remarks: m.remarks || "",
    enteredByName: m.enteredByName || "",
  };
}

export function gradeFromPct(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}
