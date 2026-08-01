import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StudentEnrollmentSchema = new Schema(
  {
    studentName: { type: String, required: true },
    identifier: { type: String, lowercase: true, index: true },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    schoolName: { type: String, required: true },
    className: { type: String, required: true, index: true },
    section: { type: String, required: true, uppercase: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    addedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    addedByName: { type: String, required: true },
    addedByRole: { type: String, required: true },
    studentUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    reviewedAt: { type: Date },
    reviewedByName: { type: String },
    note: { type: String },
  },
  { timestamps: true },
);

export type StudentEnrollmentDoc = InferSchemaType<
  typeof StudentEnrollmentSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const StudentEnrollment: Model<StudentEnrollmentDoc> =
  mongoose.models.StudentEnrollment ||
  mongoose.model<StudentEnrollmentDoc>(
    "StudentEnrollment",
    StudentEnrollmentSchema,
  );

export function enrollmentToClient(e: StudentEnrollmentDoc) {
  return {
    id: String(e._id),
    studentName: e.studentName,
    identifier: e.identifier || undefined,
    school: e.schoolName,
    schoolId: String(e.schoolId),
    className: e.className,
    section: e.section,
    classId: e.classId ? String(e.classId) : undefined,
    status: e.status,
    addedById: String(e.addedById),
    addedByName: e.addedByName,
    addedByRole: e.addedByRole,
    studentUserId: e.studentUserId ? String(e.studentUserId) : undefined,
    createdAt: e.createdAt
      ? new Date(e.createdAt as Date).getTime()
      : Date.now(),
    reviewedAt: e.reviewedAt
      ? new Date(e.reviewedAt).getTime()
      : undefined,
    reviewedByName: e.reviewedByName || undefined,
    note: e.note || undefined,
  };
}
