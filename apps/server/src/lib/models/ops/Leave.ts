import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const LeaveSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    applicantId: { type: String, required: true, index: true },
    applicantName: { type: String, required: true },
    applicantRole: { type: String, required: true },
    studentName: { type: String, required: true },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      index: true,
    },
    schoolName: { type: String, required: true },
    className: { type: String },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    appliedAt: { type: Number, default: () => Date.now() },
    reviewedBy: { type: String },
    reviewedAt: { type: Number },
    note: { type: String },
  },
  { timestamps: true },
);

LeaveSchema.index({ schoolId: 1, studentProfileId: 1, fromDate: 1, toDate: 1 });

export type LeaveDoc = InferSchemaType<typeof LeaveSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Leave: Model<LeaveDoc> =
  mongoose.models.Leave || mongoose.model<LeaveDoc>("Leave", LeaveSchema);

export function leaveToClient(l: LeaveDoc) {
  return {
    id: String(l._id),
    applicantId: l.applicantId,
    applicantName: l.applicantName,
    applicantRole: l.applicantRole,
    studentName: l.studentName,
    studentProfileId: l.studentProfileId
      ? String(l.studentProfileId)
      : undefined,
    school: l.schoolName,
    className: l.className || undefined,
    fromDate: l.fromDate,
    toDate: l.toDate,
    reason: l.reason,
    status: l.status as "pending" | "approved" | "rejected",
    appliedAt: l.appliedAt || Date.now(),
    reviewedBy: l.reviewedBy || undefined,
    reviewedAt: l.reviewedAt || undefined,
    note: l.note || undefined,
  };
}
