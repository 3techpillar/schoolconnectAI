import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AcademicSessionSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

AcademicSessionSchema.index({ schoolId: 1, label: 1 }, { unique: true });

export type AcademicSessionDoc = InferSchemaType<
  typeof AcademicSessionSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const AcademicSession: Model<AcademicSessionDoc> =
  mongoose.models.AcademicSession ||
  mongoose.model<AcademicSessionDoc>("AcademicSession", AcademicSessionSchema);

export function academicSessionToClient(s: AcademicSessionDoc) {
  return {
    id: String(s._id),
    schoolId: String(s.schoolId),
    label: s.label,
    startDate: s.startDate || "",
    endDate: s.endDate || "",
    status: s.status as "upcoming" | "active" | "completed",
  };
}
