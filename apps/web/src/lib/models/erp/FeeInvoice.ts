import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FeeInvoiceLineSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    amountPaise: { type: Number, required: true },
  },
  { _id: false },
);

const FeeInvoiceSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure" },
    termLabel: { type: String, default: "" },
    lines: { type: [FeeInvoiceLineSchema], default: [] },
    concessionPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
    paidPaise: { type: Number, default: 0 },
    dueDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "issued", "partial", "paid", "void"],
      default: "issued",
      index: true,
    },
  },
  { timestamps: true },
);

FeeInvoiceSchema.index({ schoolId: 1, status: 1 });
FeeInvoiceSchema.index({ schoolId: 1, studentProfileId: 1 });

export type FeeInvoiceDoc = InferSchemaType<typeof FeeInvoiceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FeeInvoice: Model<FeeInvoiceDoc> =
  mongoose.models.FeeInvoice ||
  mongoose.model<FeeInvoiceDoc>("FeeInvoice", FeeInvoiceSchema);

export function feeInvoiceToClient(inv: FeeInvoiceDoc) {
  return {
    id: String(inv._id),
    schoolId: String(inv.schoolId),
    studentProfileId: String(inv.studentProfileId),
    userId: inv.userId ? String(inv.userId) : undefined,
    feeStructureId: inv.feeStructureId
      ? String(inv.feeStructureId)
      : undefined,
    termLabel: inv.termLabel || "",
    lines: (inv.lines || []).map((l) => ({
      key: l.key,
      label: l.label,
      amountPaise: l.amountPaise || 0,
    })),
    concessionPaise: inv.concessionPaise || 0,
    totalPaise: inv.totalPaise || 0,
    paidPaise: inv.paidPaise || 0,
    dueDate: inv.dueDate || "",
    status: inv.status as "draft" | "issued" | "partial" | "paid" | "void",
    createdAt: inv.createdAt
      ? new Date(inv.createdAt as Date).getTime()
      : Date.now(),
  };
}
