import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SubjectSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    className: { type: String, default: "", index: true },
    teacherUserId: { type: Schema.Types.ObjectId, ref: "User" },
    teacherName: { type: String, default: "" },
    mandatory: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

SubjectSchema.index({ schoolId: 1, code: 1, className: 1 }, { unique: true });

export type SubjectDoc = InferSchemaType<typeof SubjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Subject: Model<SubjectDoc> =
  mongoose.models.Subject || mongoose.model<SubjectDoc>("Subject", SubjectSchema);

export function subjectToClient(s: SubjectDoc) {
  return {
    id: String(s._id),
    schoolId: String(s.schoolId),
    code: s.code,
    name: s.name,
    className: s.className || "",
    teacherUserId: s.teacherUserId ? String(s.teacherUserId) : undefined,
    teacherName: s.teacherName || "",
    mandatory: Boolean(s.mandatory),
    active: Boolean(s.active),
    createdAt: s.createdAt
      ? new Date(s.createdAt as Date).getTime()
      : Date.now(),
  };
}
