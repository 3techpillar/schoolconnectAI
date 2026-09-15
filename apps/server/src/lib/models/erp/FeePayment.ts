import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Explicit payment transactions (separate from FeeInvoice + FeeAccount ledger). */
const FeePaymentSchema = new Schema(
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
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "FeeInvoice", index: true },
    amountPaise: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "upi", "card", "netbanking", "wallet", "demo", "other"],
      default: "demo",
    },
    gateway: { type: String, default: "" },
    transactionId: { type: String, default: "", index: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "success",
      index: true,
    },
    paidAt: { type: Number, default: () => Date.now() },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

FeePaymentSchema.index({ schoolId: 1, paidAt: -1 });

export type FeePaymentDoc = InferSchemaType<typeof FeePaymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FeePayment: Model<FeePaymentDoc> =
  mongoose.models.FeePayment ||
  mongoose.model<FeePaymentDoc>("FeePayment", FeePaymentSchema);

export function feePaymentToClient(p: FeePaymentDoc) {
  return {
    id: String(p._id),
    schoolId: String(p.schoolId),
    studentProfileId: p.studentProfileId
      ? String(p.studentProfileId)
      : undefined,
    userId: p.userId ? String(p.userId) : undefined,
    invoiceId: p.invoiceId ? String(p.invoiceId) : undefined,
    amountPaise: p.amountPaise || 0,
    method: p.method || "demo",
    gateway: p.gateway || "",
    transactionId: p.transactionId || "",
    status: p.status as "pending" | "success" | "failed" | "refunded",
    paidAt: p.paidAt || Date.now(),
    note: p.note || "",
  };
}
