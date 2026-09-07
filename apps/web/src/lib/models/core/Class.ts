import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PeriodSchema = new Schema(
  {
    day: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri", "sat"],
      required: true,
    },
    period: { type: Number, required: true, min: 1, max: 12 },
    subject: { type: String, default: "" },
    teacherName: { type: String, default: "" },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
  },
  { _id: false },
);

/** Class / section (ClassSection MDM). Collection name remains `classes`. */
const ClassSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    grade: { type: String, required: true },
    section: { type: String, required: true, uppercase: true },
    className: { type: String, required: true, index: true },
    classTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
    capacity: { type: Number, default: 40 },
    /** Stub timetable — read-only for apps later */
    periods: { type: [PeriodSchema], default: [] },
  },
  { timestamps: true },
);

ClassSchema.index({ schoolId: 1, className: 1 }, { unique: true });

export type ClassDoc = InferSchemaType<typeof ClassSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClassModel: Model<ClassDoc> =
  mongoose.models.Class || mongoose.model<ClassDoc>("Class", ClassSchema);

/** Alias — ERP ClassSection terminology. */
export const ClassSection = ClassModel;
export type ClassSectionDoc = ClassDoc;

export function classSectionToClient(c: ClassDoc) {
  return {
    id: String(c._id),
    schoolId: String(c.schoolId),
    grade: c.grade,
    section: c.section,
    className: c.className,
    classTeacherId: c.classTeacherId ? String(c.classTeacherId) : undefined,
    capacity: c.capacity ?? 40,
    periods: (c.periods || []).map((p) => ({
      day: p.day as "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
      period: p.period,
      subject: p.subject || "",
      teacherName: p.teacherName || "",
      startTime: p.startTime || "",
      endTime: p.endTime || "",
    })),
    createdAt: c.createdAt
      ? new Date(c.createdAt as Date).getTime()
      : Date.now(),
  };
}
