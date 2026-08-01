import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const USER_ROLES = [
  "parent",
  "student",
  "class_teacher",
  "bus_attendant",
  "principal",
  "admin",
  "super_admin",
] as const;

const UserSchema = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    identifierType: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    schoolName: { type: String, default: "" },
    className: { type: String },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    childName: { type: String },
    academicYear: { type: String, default: "2025-26" },
    enrollmentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    inviteCode: { type: String },
    busRouteId: { type: String, default: "route-12" },
    homeStopId: { type: String, default: "s3" },
    busAlert10: { type: Boolean, default: true },
    busAlert5: { type: Boolean, default: true },
    classHistory: [
      {
        sessionId: String,
        sessionLabel: String,
        className: String,
        result: { type: String, enum: ["pass", "fail", "pending"] },
        promotedTo: String,
        at: Number,
      },
    ],
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);

export function userToClient(u: UserDoc) {
  return {
    id: String(u._id),
    identifier: u.identifier,
    identifierType: u.identifierType as "email" | "phone",
    name: u.name,
    role: u.role as (typeof USER_ROLES)[number],
    school: u.schoolName || "",
    schoolId: u.schoolId ? String(u.schoolId) : undefined,
    className: u.className || undefined,
    classId: u.classId ? String(u.classId) : undefined,
    childName: u.childName || undefined,
    academicYear: u.academicYear || undefined,
    enrollmentStatus: u.enrollmentStatus as
      | "pending"
      | "approved"
      | "rejected",
    inviteCode: u.inviteCode || undefined,
    busRouteId: u.busRouteId || undefined,
    homeStopId: u.homeStopId || undefined,
    busAlert10: u.busAlert10,
    busAlert5: u.busAlert5,
    classHistory: u.classHistory || [],
    createdAt: u.createdAt
      ? new Date(u.createdAt as Date).getTime()
      : Date.now(),
    updatedAt: u.updatedAt
      ? new Date(u.updatedAt as Date).getTime()
      : undefined,
  };
}
