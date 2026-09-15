import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExamPaperSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, required: true },
    maxMarks: { type: Number, default: 100 },
    examDate: { type: String, default: "" },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    room: { type: String, default: "" },
  },
  { _id: false },
);

const ExamSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "unit_test",
        "mid_term",
        "final",
        "monthly",
        "practical",
        "custom",
      ],
      default: "custom",
    },
    academicYear: { type: String, default: "2025-26" },
    className: { type: String, default: "", index: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "scheduled", "ongoing", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    papers: { type: [ExamPaperSchema], default: [] },
  },
  { timestamps: true },
);

ExamSchema.index({ schoolId: 1, academicYear: 1, className: 1 });

export type ExamDoc = InferSchemaType<typeof ExamSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Exam: Model<ExamDoc> =
  mongoose.models.Exam || mongoose.model<ExamDoc>("Exam", ExamSchema);

export function examToClient(e: ExamDoc) {
  return {
    id: String(e._id),
    schoolId: String(e.schoolId),
    name: e.name,
    type: e.type as
      | "unit_test"
      | "mid_term"
      | "final"
      | "monthly"
      | "practical"
      | "custom",
    academicYear: e.academicYear || "2025-26",
    className: e.className || "",
    startDate: e.startDate || "",
    endDate: e.endDate || "",
    status: e.status as
      | "draft"
      | "scheduled"
      | "ongoing"
      | "completed"
      | "cancelled",
    papers: (e.papers || []).map((p) => ({
      subjectId: p.subjectId ? String(p.subjectId) : undefined,
      subjectCode: p.subjectCode || "",
      subjectName: p.subjectName,
      maxMarks: p.maxMarks ?? 100,
      examDate: p.examDate || "",
      startTime: p.startTime || "",
      endTime: p.endTime || "",
      room: p.room || "",
    })),
    createdAt: e.createdAt
      ? new Date(e.createdAt as Date).getTime()
      : Date.now(),
  };
}
