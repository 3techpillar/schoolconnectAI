import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DoubtAnswerSchema = new Schema(
  {
    answerId: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    text: { type: String, required: true },
    isAccepted: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    createdAtMs: { type: Number, default: () => Date.now() },
  },
  { _id: false },
);

const DoubtSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    className: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: { type: [String], default: [] },
    isResolved: { type: Boolean, default: false },
    answers: { type: [DoubtAnswerSchema], default: [] },
    createdAtMs: { type: Number, default: () => Date.now(), index: true },
  },
  { timestamps: true },
);

export type DoubtDoc = InferSchemaType<typeof DoubtSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Doubt: Model<DoubtDoc> =
  mongoose.models.Doubt || mongoose.model<DoubtDoc>("Doubt", DoubtSchema);

export function doubtToClient(d: DoubtDoc) {
  return {
    id: String(d._id),
    className: d.className,
    subject: d.subject,
    studentId: d.studentId,
    studentName: d.studentName,
    title: d.title,
    body: d.body,
    tags: d.tags || [],
    isResolved: d.isResolved || false,
    createdAt: d.createdAtMs || Date.now(),
    answers: (d.answers || []).map((a) => ({
      answerId: a.answerId,
      authorId: a.authorId,
      authorName: a.authorName,
      authorRole: a.authorRole,
      text: a.text,
      isAccepted: a.isAccepted || false,
      upvotes: a.upvotes || 0,
      createdAt: a.createdAtMs || Date.now(),
    })),
  };
}
