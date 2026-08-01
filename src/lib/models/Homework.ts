import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

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
    due: { type: String, default: "" },
    dueDate: { type: String },
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
    due: h.due || "",
    dueDate: h.dueDate || undefined,
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
  };
}
