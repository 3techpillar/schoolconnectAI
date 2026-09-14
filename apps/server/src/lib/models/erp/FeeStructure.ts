import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FeeHeadSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    amountPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const FeeStructureSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true },
    className: { type: String, default: "" },
    termLabel: { type: String, default: "" },
    heads: { type: [FeeHeadSchema], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

FeeStructureSchema.index({ schoolId: 1, academicYear: 1, className: 1 });

export type FeeStructureDoc = InferSchemaType<typeof FeeStructureSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FeeStructure: Model<FeeStructureDoc> =
  mongoose.models.FeeStructure ||
  mongoose.model<FeeStructureDoc>("FeeStructure", FeeStructureSchema);

export function feeStructureToClient(f: FeeStructureDoc) {
  const heads = f.heads || [];
  const totalPaise = heads.reduce((sum, h) => sum + (h.amountPaise || 0), 0);
  return {
    id: String(f._id),
    schoolId: String(f.schoolId),
    name: f.name,
    academicYear: f.academicYear,
    className: f.className || "",
    termLabel: f.termLabel || "",
    heads: heads.map((h) => ({
      key: h.key,
      label: h.label,
      amountPaise: h.amountPaise || 0,
    })),
    totalPaise,
    active: Boolean(f.active),
    createdAt: f.createdAt
      ? new Date(f.createdAt as Date).getTime()
      : Date.now(),
  };
}
