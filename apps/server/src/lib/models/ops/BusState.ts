import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const BusStateSchema = new Schema(
  {
    routeId: { type: String, required: true, default: "route-12", index: true },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      index: true,
    },
    progress: { type: Number, default: 0.08 },
    /** day ISO + ten/five flags shared for the live trip */
    alertDay: { type: String, default: "" },
    alertTen: { type: Boolean, default: false },
    alertFive: { type: Boolean, default: false },
    updatedAtMs: { type: Number, default: () => Date.now() },
  },
  { timestamps: true },
);

BusStateSchema.index({ routeId: 1, schoolId: 1 }, { unique: true, sparse: true });

export type BusStateDoc = InferSchemaType<typeof BusStateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BusState: Model<BusStateDoc> =
  mongoose.models.BusState ||
  mongoose.model<BusStateDoc>("BusState", BusStateSchema);
