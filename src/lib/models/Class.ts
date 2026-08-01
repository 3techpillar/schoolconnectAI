import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

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
  },
  { timestamps: true },
);

ClassSchema.index({ schoolId: 1, className: 1 }, { unique: true });

export type ClassDoc = InferSchemaType<typeof ClassSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClassModel: Model<ClassDoc> =
  mongoose.models.Class || mongoose.model<ClassDoc>("Class", ClassSchema);
