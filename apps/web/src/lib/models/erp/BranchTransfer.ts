import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Inter-branch student transfer within the same school group (`groupCode`).
 * Source admin creates → destination admin approves/rejects.
 */
const BranchTransferSchema = new Schema(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      index: true,
    },
    studentName: { type: String, default: "" },
    fromSchoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    toSchoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    groupCode: { type: String, default: "", uppercase: true, index: true },
    fromClassName: { type: String, default: "" },
    toClassName: { type: String, default: "" },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    requestedById: { type: Schema.Types.ObjectId, ref: "User" },
    requestedByName: { type: String, default: "" },
    reviewedById: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedByName: { type: String, default: "" },
    reviewNote: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

BranchTransferSchema.index({ toSchoolId: 1, status: 1 });
BranchTransferSchema.index({ fromSchoolId: 1, status: 1 });

export type BranchTransferDoc = InferSchemaType<typeof BranchTransferSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BranchTransfer: Model<BranchTransferDoc> =
  mongoose.models.BranchTransfer ||
  mongoose.model<BranchTransferDoc>("BranchTransfer", BranchTransferSchema);

export function branchTransferToClient(t: BranchTransferDoc) {
  return {
    id: String(t._id),
    studentUserId: String(t.studentUserId),
    studentProfileId: t.studentProfileId
      ? String(t.studentProfileId)
      : undefined,
    studentName: t.studentName || "",
    fromSchoolId: String(t.fromSchoolId),
    toSchoolId: String(t.toSchoolId),
    groupCode: t.groupCode || "",
    fromClassName: t.fromClassName || "",
    toClassName: t.toClassName || "",
    reason: t.reason || "",
    status: t.status as "pending" | "approved" | "rejected" | "cancelled",
    requestedByName: t.requestedByName || "",
    reviewedByName: t.reviewedByName || "",
    reviewNote: t.reviewNote || "",
    reviewedAt: t.reviewedAt
      ? new Date(t.reviewedAt as Date).getTime()
      : undefined,
    createdAt: t.createdAt
      ? new Date(t.createdAt as Date).getTime()
      : Date.now(),
  };
}
