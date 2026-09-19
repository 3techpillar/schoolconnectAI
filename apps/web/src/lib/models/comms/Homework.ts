import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SubmissionSchema = new Schema(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    submittedAtMs: { type: Number, default: () => Date.now() },
    content: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },
    grade: { type: String, default: "" },
    feedback: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "reviewed", "resubmit"],
      default: "submitted",
    },
  },
  { _id: false },
);

const HomeworkSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    due: { type: String, default: "" },
    dueDate: { type: String },
    maxMarks: { type: Number, default: 10 },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    attachments: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "in-progress", "submitted", "reviewed"],
      default: "pending",
    },
    className: { type: String, required: true, index: true },
    postedBy: { type: String, required: true },
    postedById: { type: String },
    notes: { type: String },
    submissions: { type: [SubmissionSchema], default: [] },
    createdAtMs: { type: Number, default: () => Date.now(), index: true },
  },
  { timestamps: true },
);

export type HomeworkDoc = InferSchemaType<typeof HomeworkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Homework: Model<HomeworkDoc> =
  mongoose.models.Homework ||
  mongoose.model<HomeworkDoc>("Homework", HomeworkSchema);

export function homeworkToClient(h: HomeworkDoc) {
  return {
    id: String(h._id),
    subject: h.subject,
    title: h.title,
    description: h.description || "",
    due: h.due || "",
    dueDate: h.dueDate || undefined,
    maxMarks: h.maxMarks || 10,
    priority: h.priority as "high" | "medium" | "low",
    attachments: h.attachments || 0,
    status: h.status as
      | "pending"
      | "in-progress"
      | "submitted"
      | "reviewed",
    className: h.className,
    postedBy: h.postedBy,
    createdAt: h.createdAtMs || Date.now(),
    notes: h.notes || undefined,
    submissions: (h.submissions || []).map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      submittedAtMs: s.submittedAtMs,
      content: s.content || "",
      attachmentUrl: s.attachmentUrl || "",
      grade: s.grade || "",
      feedback: s.feedback || "",
      status: s.status as "submitted" | "reviewed" | "resubmit",
    })),
  };
}
