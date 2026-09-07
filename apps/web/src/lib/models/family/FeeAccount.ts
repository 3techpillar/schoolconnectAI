import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FeePaymentSchema = new Schema(
  {
    title: { type: String, required: true },
    dateLabel: { type: String, required: true },
    amountLabel: { type: String, required: true },
    amountPaise: { type: Number, default: 0 },
    paidAt: { type: Number },
  },
  { _id: false },
);

const FeeAccountSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    termLabel: { type: String, default: "Term 2 · 2025-26" },
    outstandingPaise: { type: Number, default: 420000 },
    basePaise: { type: Number, default: 400000 },
    penaltyPaise: { type: Number, default: 20000 },
    dueDate: { type: String, default: "2026-06-28" },
    dueDateLabel: { type: String, default: "28 Jun 2026" },
    overdue: { type: Boolean, default: true },
    paidYearPaise: { type: Number, default: 3880000 },
    annualPaise: { type: Number, default: 4300000 },
    history: { type: [FeePaymentSchema], default: [] },
  },
  { timestamps: true },
);

FeeAccountSchema.index({ schoolId: 1, userId: 1 }, { unique: true });

export type FeeAccountDoc = InferSchemaType<typeof FeeAccountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FeeAccount: Model<FeeAccountDoc> =
  mongoose.models.FeeAccount ||
  mongoose.model<FeeAccountDoc>("FeeAccount", FeeAccountSchema);

import { formatInrPaise } from "@/lib/shared/money";

export function feeAccountToClient(f: FeeAccountDoc) {
  return {
    id: String(f._id),
    termLabel: f.termLabel || "Term 2 · 2025-26",
    outstanding: formatInrPaise(f.outstandingPaise || 0),
    outstandingPaise: f.outstandingPaise || 0,
    baseAmount: formatInrPaise(f.basePaise || 0),
    latePenalty: formatInrPaise(f.penaltyPaise || 0),
    dueDate: f.dueDate || "",
    dueDateLabel: f.dueDateLabel || f.dueDate || "",
    overdue: Boolean(f.overdue),
    paidThisYear: formatInrPaise(f.paidYearPaise || 0),
    totalAnnual: formatInrPaise(f.annualPaise || 0),
    history: (f.history || []).map((h) => ({
      title: h.title,
      date: h.dateLabel,
      amount: h.amountLabel,
    })),
  };
}
