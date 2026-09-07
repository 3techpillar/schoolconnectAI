import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const GuardianSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
      default: "guardian",
    },
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    isPrimary: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const MedicalSchema = new Schema(
  {
    allergies: { type: String, default: "" },
    conditions: { type: String, default: "" },
    emergencyNotes: { type: String, default: "" },
    doctorContact: { type: String, default: "" },
  },
  { _id: false },
);

const StudentProfileSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    branchId: { type: String, default: "", index: true },
    studentId: { type: String, trim: true, index: true },
    admissionNo: { type: String, trim: true, index: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    dob: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", "unspecified"],
      default: "unspecified",
    },
    photoUrl: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    nationality: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    guardians: { type: [GuardianSchema], default: [] },
    medical: { type: MedicalSchema, default: () => ({}) },
    admissionDate: { type: String, default: "" },
    previousSchool: { type: String, default: "" },
    classSectionId: { type: Schema.Types.ObjectId, ref: "Class", index: true },
    className: { type: String, default: "", index: true },
    rollNo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["prospect", "enrolled", "alumni", "left", "inactive"],
      default: "enrolled",
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    academicYear: { type: String, default: "2025-26" },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

StudentProfileSchema.index({ schoolId: 1, status: 1 });
StudentProfileSchema.index({ schoolId: 1, classSectionId: 1 });
StudentProfileSchema.index({ schoolId: 1, studentId: 1 });
StudentProfileSchema.index(
  { schoolId: 1, admissionNo: 1 },
  {
    unique: true,
    partialFilterExpression: { admissionNo: { $type: "string", $gt: "" } },
  },
);

export type StudentProfileDoc = InferSchemaType<typeof StudentProfileSchema> &
  mongoose.Document & {
    _id: mongoose.Types.ObjectId;
  };

export const StudentProfile: Model<StudentProfileDoc> =
  mongoose.models.StudentProfile ||
  mongoose.model<StudentProfileDoc>("StudentProfile", StudentProfileSchema);

export function studentProfileToClient(p: StudentProfileDoc) {
  const medical = p.medical || {};
  return {
    id: String(p._id),
    schoolId: String(p.schoolId),
    branchId: p.branchId || "",
    studentId: p.studentId || undefined,
    admissionNo: p.admissionNo || undefined,
    firstName: p.firstName || "",
    lastName: p.lastName || "",
    name: p.name,
    dob: p.dob || "",
    gender: (p.gender || "unspecified") as
      | "male"
      | "female"
      | "other"
      | "unspecified",
    photoUrl: p.photoUrl || "",
    bloodGroup: p.bloodGroup || "",
    nationality: p.nationality || "",
    address: p.address || "",
    city: p.city || "",
    state: p.state || "",
    country: p.country || "",
    mobile: p.mobile || "",
    email: p.email || "",
    guardians: (p.guardians || []).map((g) => ({
      name: g.name,
      relationship: (g.relationship || "guardian") as
        | "father"
        | "mother"
        | "guardian"
        | "other",
      phone: g.phone || "",
      email: g.email || "",
      isPrimary: Boolean(g.isPrimary),
      userId: g.userId ? String(g.userId) : undefined,
    })),
    medical: {
      allergies: (medical as { allergies?: string }).allergies || "",
      conditions: (medical as { conditions?: string }).conditions || "",
      emergencyNotes: (medical as { emergencyNotes?: string }).emergencyNotes || "",
      doctorContact: (medical as { doctorContact?: string }).doctorContact || "",
    },
    admissionDate: p.admissionDate || "",
    previousSchool: p.previousSchool || "",
    classSectionId: p.classSectionId ? String(p.classSectionId) : undefined,
    className: p.className || "",
    rollNo: p.rollNo || "",
    status: (p.status || "enrolled") as
      | "prospect"
      | "enrolled"
      | "alumni"
      | "left"
      | "inactive",
    userId: p.userId ? String(p.userId) : undefined,
    academicYear: p.academicYear || "2025-26",
    note: p.note || "",
    createdAt: p.createdAt
      ? new Date(p.createdAt as Date).getTime()
      : Date.now(),
    updatedAt: p.updatedAt
      ? new Date(p.updatedAt as Date).getTime()
      : undefined,
  };
}
