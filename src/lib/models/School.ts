import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SchoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
  },
  { timestamps: true },
);

export type SchoolDoc = InferSchemaType<typeof SchoolSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const School: Model<SchoolDoc> =
  mongoose.models.School || mongoose.model<SchoolDoc>("School", SchoolSchema);
