import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TeacherInviteSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    identifier: { type: String, required: true, lowercase: true, index: true },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    schoolName: { type: String, required: true },
    role: {
      type: String,
      enum: ["class_teacher", "principal", "bus_attendant"],
      default: "class_teacher",
    },
    className: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
      index: true,
    },
    invitedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitedByName: { type: String, required: true },
    acceptedAt: { type: Date },
    acceptedUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type TeacherInviteDoc = InferSchemaType<typeof TeacherInviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TeacherInvite: Model<TeacherInviteDoc> =
  mongoose.models.TeacherInvite ||
  mongoose.model<TeacherInviteDoc>("TeacherInvite", TeacherInviteSchema);

export function inviteToClient(i: TeacherInviteDoc) {
  return {
    id: String(i._id),
    code: i.code,
    name: i.name,
    identifier: i.identifier,
    school: i.schoolName,
    schoolId: String(i.schoolId),
    role: i.role,
    className: i.className || undefined,
    status: i.status,
    invitedById: String(i.invitedById),
    invitedByName: i.invitedByName,
    createdAt: i.createdAt
      ? new Date(i.createdAt as Date).getTime()
      : Date.now(),
    acceptedAt: i.acceptedAt
      ? new Date(i.acceptedAt).getTime()
      : undefined,
    acceptedUserId: i.acceptedUserId
      ? String(i.acceptedUserId)
      : undefined,
  };
}
