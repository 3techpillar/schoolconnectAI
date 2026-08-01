import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SessionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    schoolName: { type: String, default: "" },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    startsOn: { type: String, required: true },
    endsOn: { type: String, required: true },
  },
  { _id: false },
);

const PromotionSchema = new Schema(
  {
    key: { type: String, required: true },
    sessionId: { type: String, required: true },
    at: { type: Number, required: true },
    by: { type: String, required: true },
    results: [
      {
        studentId: String,
        name: String,
        fromClass: String,
        toClass: String,
        result: { type: String, enum: ["pass", "fail"] },
      },
    ],
  },
  { _id: false },
);

const AdminDataSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      index: true,
    },
    /** null schoolId = platform-wide super-admin store */
    scope: { type: String, default: "school", index: true },
    sessions: { type: [SessionSchema], default: [] },
    promotionLog: { type: [PromotionSchema], default: [] },
  },
  { timestamps: true },
);

AdminDataSchema.index(
  { schoolId: 1, scope: 1 },
  { unique: true, sparse: true },
);

export type AdminDataDoc = InferSchemaType<typeof AdminDataSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminData: Model<AdminDataDoc> =
  mongoose.models.AdminData ||
  mongoose.model<AdminDataDoc>("AdminData", AdminDataSchema);
