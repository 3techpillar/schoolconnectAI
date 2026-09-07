import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ParentStudentLinkSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    parentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
      default: "guardian",
    },
    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "active",
      index: true,
    },
    primary: { type: Boolean, default: true },
    note: { type: String },
  },
  { timestamps: true },
);

ParentStudentLinkSchema.index(
  { parentUserId: 1, studentUserId: 1 },
  { unique: true },
);

export type ParentStudentLinkDoc = InferSchemaType<
  typeof ParentStudentLinkSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const ParentStudentLink: Model<ParentStudentLinkDoc> =
  mongoose.models.ParentStudentLink ||
  mongoose.model<ParentStudentLinkDoc>(
    "ParentStudentLink",
    ParentStudentLinkSchema,
  );

export function linkToClient(l: ParentStudentLinkDoc) {
  return {
    id: String(l._id),
    schoolId: String(l.schoolId),
    parentUserId: String(l.parentUserId),
    studentUserId: String(l.studentUserId),
    studentProfileId: l.studentProfileId
      ? String(l.studentProfileId)
      : undefined,
    relationship: l.relationship || "guardian",
    status: l.status || "active",
    primary: Boolean(l.primary),
    note: l.note || undefined,
    createdAt: l.createdAt
      ? new Date(l.createdAt as Date).getTime()
      : Date.now(),
  };
}
