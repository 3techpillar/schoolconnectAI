import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DocChecklistItemSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "received", "waived"],
      default: "pending",
    },
    url: { type: String, default: "" },
  },
  { _id: false },
);

export const ADMISSION_STATUSES = [
  "enquiry",
  "submitted",
  "under_review",
  "documents_pending",
  "interview_scheduled",
  "approved",
  "offered",
  "enrolled",
  "rejected",
  "withdrawn",
] as const;

const AdmissionApplicationSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    applicationNo: { type: String, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    identifier: { type: String, lowercase: true, index: true },
    applyingClassName: { type: String, required: true },
    section: { type: String, default: "", uppercase: true },
    status: {
      type: String,
      enum: ADMISSION_STATUSES,
      default: "submitted",
      index: true,
    },
    interviewAt: { type: String, default: "" },
    interviewNotes: { type: String, default: "" },
    admissionFeePaise: { type: Number, default: 0 },
    admissionFeePaid: { type: Boolean, default: false },
    documents: { type: [DocChecklistItemSchema], default: [] },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
      index: true,
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      index: true,
    },
    applicantUserId: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, default: "" },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

AdmissionApplicationSchema.index({ schoolId: 1, status: 1 });
AdmissionApplicationSchema.index(
  { schoolId: 1, applicationNo: 1 },
  {
    unique: true,
    partialFilterExpression: { applicationNo: { $type: "string", $gt: "" } },
  },
);

export type AdmissionApplicationDoc = InferSchemaType<
  typeof AdmissionApplicationSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const AdmissionApplication: Model<AdmissionApplicationDoc> =
  mongoose.models.AdmissionApplication ||
  mongoose.model<AdmissionApplicationDoc>(
    "AdmissionApplication",
    AdmissionApplicationSchema,
  );

export function admissionApplicationToClient(a: AdmissionApplicationDoc) {
  return {
    id: String(a._id),
    schoolId: String(a.schoolId),
    applicationNo: a.applicationNo || undefined,
    studentName: a.studentName,
    identifier: a.identifier || undefined,
    applyingClassName: a.applyingClassName,
    section: a.section || "",
    status: a.status as (typeof ADMISSION_STATUSES)[number],
    interviewAt: a.interviewAt || "",
    interviewNotes: a.interviewNotes || "",
    admissionFeePaise: a.admissionFeePaise || 0,
    admissionFeePaid: Boolean(a.admissionFeePaid),
    documents: (a.documents || []).map((d) => ({
      key: d.key,
      label: d.label,
      status: (d.status || "pending") as "pending" | "received" | "waived",
      url: d.url || "",
    })),
    enrollmentId: a.enrollmentId ? String(a.enrollmentId) : undefined,
    studentProfileId: a.studentProfileId
      ? String(a.studentProfileId)
      : undefined,
    applicantUserId: a.applicantUserId
      ? String(a.applicantUserId)
      : undefined,
    note: a.note || "",
    reviewedByName: a.reviewedByName || undefined,
    reviewedAt: a.reviewedAt
      ? new Date(a.reviewedAt).getTime()
      : undefined,
    createdAt: a.createdAt
      ? new Date(a.createdAt as Date).getTime()
      : Date.now(),
  };
}

export function nextApplicationNo(schoolCode: string, seq: number) {
  const year = new Date().getFullYear();
  return `${(schoolCode || "APP").slice(0, 6).toUpperCase()}-${year}-${String(seq).padStart(4, "0")}`;
}
