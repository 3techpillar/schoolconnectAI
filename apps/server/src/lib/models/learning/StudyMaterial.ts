import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StudyMaterialSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    className: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    chapter: { type: String, default: "General" },
    kind: {
      type: String,
      enum: ["pdf", "video", "link", "notes", "quiz"],
      default: "pdf",
    },
    fileUrl: { type: String, default: "" },
    downloadCount: { type: Number, default: 0 },
    uploadedBy: { type: String, required: true },
    uploadedById: { type: String },
    createdAtMs: { type: Number, default: () => Date.now(), index: true },
  },
  { timestamps: true },
);

export type StudyMaterialDoc = InferSchemaType<typeof StudyMaterialSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StudyMaterial: Model<StudyMaterialDoc> =
  mongoose.models.StudyMaterial ||
  mongoose.model<StudyMaterialDoc>("StudyMaterial", StudyMaterialSchema);

export function studyMaterialToClient(m: StudyMaterialDoc) {
  return {
    id: String(m._id),
    className: m.className,
    subject: m.subject,
    title: m.title,
    description: m.description || "",
    chapter: m.chapter || "General",
    kind: m.kind as "pdf" | "video" | "link" | "notes" | "quiz",
    fileUrl: m.fileUrl || "",
    downloadCount: m.downloadCount || 0,
    uploadedBy: m.uploadedBy,
    createdAt: m.createdAtMs || Date.now(),
  };
}
