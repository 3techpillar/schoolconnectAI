import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StaffProfileSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    employeeId: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    designation: { type: String, default: "" },
    subjects: { type: [String], default: [] },
    classSectionIds: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

StaffProfileSchema.index({ schoolId: 1, employeeId: 1 });

export type StaffProfileDoc = InferSchemaType<typeof StaffProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StaffProfile: Model<StaffProfileDoc> =
  mongoose.models.StaffProfile ||
  mongoose.model<StaffProfileDoc>("StaffProfile", StaffProfileSchema);

export function staffProfileToClient(s: StaffProfileDoc) {
  return {
    id: String(s._id),
    schoolId: String(s.schoolId),
    employeeId: s.employeeId || undefined,
    name: s.name,
    userId: s.userId ? String(s.userId) : undefined,
    designation: s.designation || "",
    subjects: s.subjects || [],
    classSectionIds: (s.classSectionIds || []).map((id) => String(id)),
    phone: s.phone || "",
    email: s.email || "",
    status: (s.status || "active") as "active" | "inactive",
    createdAt: s.createdAt
      ? new Date(s.createdAt as Date).getTime()
      : Date.now(),
  };
}
