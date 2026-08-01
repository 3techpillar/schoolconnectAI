import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const RosterStudentSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    parentName: { type: String, default: "" },
    avatar: { type: String, default: "?" },
    parentChatId: { type: String, default: "" },
    className: { type: String, required: true },
    userId: { type: String },
  },
  { _id: false },
);

const CircularSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tag: { type: String, default: "Notice" },
    createdAt: { type: Number, default: () => Date.now() },
    unreadBy: { type: [String], default: [] },
    postedBy: { type: String, required: true },
    className: { type: String },
  },
  { _id: false },
);

const ClassDeskSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    className: { type: String, required: true, index: true },
    roster: { type: [RosterStudentSchema], default: [] },
    /** dateKey -> studentKey -> mark */
    attendanceByDay: { type: Schema.Types.Mixed, default: {} },
    circulars: { type: [CircularSchema], default: [] },
  },
  { timestamps: true },
);

ClassDeskSchema.index({ schoolId: 1, className: 1 }, { unique: true });

export type ClassDeskDoc = InferSchemaType<typeof ClassDeskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClassDesk: Model<ClassDeskDoc> =
  mongoose.models.ClassDesk ||
  mongoose.model<ClassDeskDoc>("ClassDesk", ClassDeskSchema);

export function classDeskToClient(d: ClassDeskDoc, userId?: string) {
  return {
    roster: (d.roster || []).map((s) => ({
      id: s.key,
      name: s.name,
      rollNo: s.rollNo,
      parentName: s.parentName || "",
      avatar: s.avatar || "?",
      parentChatId: s.parentChatId || `parent-${s.key}`,
      className: s.className,
    })),
    attendanceByDay: (d.attendanceByDay || {}) as Record<
      string,
      Record<string, "P" | "A" | "L" | "H">
    >,
    circulars: (d.circulars || [])
      .map((c) => ({
        id: c.key,
        title: c.title,
        body: c.body,
        tag: c.tag || "Notice",
        createdAt: c.createdAt || Date.now(),
        unread: userId ? (c.unreadBy || []).includes(userId) : false,
        postedBy: c.postedBy,
        className: c.className || undefined,
      }))
      .sort((a, b) => b.createdAt - a.createdAt),
  };
}
