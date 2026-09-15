import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  defaultSubscriptionExpiry,
  isSubscriptionActive,
  normalizeProductMode,
  normalizeTransferPolicy,
  schoolCapabilities,
  toExpiryMs,
  type ProductMode,
  type TransferPolicy,
} from "@schoolconnect/shared";

const SchoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, index: true },
    city: { type: String, default: "" },
    board: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    academicYearCurrent: { type: String, default: "2025-26" },
    parentSchoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      index: true,
    },
    branchName: { type: String, default: "" },
    /** Shared code for multi-branch groups (e.g. RADMOS). */
    groupCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      default: "",
    },
    logoUrl: { type: String, default: "" },
    /** connect = collab; erp = full school ERP */
    productMode: {
      type: String,
      enum: ["connect", "erp"],
      default: "connect",
      index: true,
    },
    /**
     * group_only — transfers only within same groupCode.
     * open — this campus may be a destination for cross-group transfers.
     */
    transferPolicy: {
      type: String,
      enum: ["group_only", "open"],
      default: "group_only",
      index: true,
    },
    /** Free plan by default; set end date (typically +1 year). */
    subscriptionPlan: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    subscriptionStartsAt: { type: Date, default: () => new Date() },
    subscriptionExpiresAt: {
      type: Date,
      default: () => defaultSubscriptionExpiry(),
      index: true,
    },
    settings: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

SchoolSchema.index({ name: 1, city: 1 });

export type SchoolDoc = InferSchemaType<typeof SchoolSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const School: Model<SchoolDoc> =
  mongoose.models.School || mongoose.model<SchoolDoc>("School", SchoolSchema);

export function schoolToClient(s: SchoolDoc) {
  const productMode = normalizeProductMode(s.productMode) as ProductMode;
  const transferPolicy = normalizeTransferPolicy(
    s.transferPolicy,
  ) as TransferPolicy;
  const settings = (s.settings || {}) as {
    modules?: Record<string, boolean>;
    [key: string]: unknown;
  };
  const subscriptionExpiresAt = toExpiryMs(s.subscriptionExpiresAt as Date);
  const subscriptionStartsAt = toExpiryMs(s.subscriptionStartsAt as Date);
  return {
    id: String(s._id),
    name: s.name,
    code: s.code || undefined,
    city: s.city || "",
    board: s.board || "",
    address: s.address || "",
    phone: s.phone || "",
    email: s.email || "",
    academicYearCurrent: s.academicYearCurrent || "2025-26",
    parentSchoolId: s.parentSchoolId ? String(s.parentSchoolId) : undefined,
    branchName: s.branchName || "",
    groupCode: s.groupCode || "",
    logoUrl: s.logoUrl || "",
    productMode,
    transferPolicy,
    subscriptionPlan: (s.subscriptionPlan || "free") as "free" | "paid",
    subscriptionStartsAt: subscriptionStartsAt ?? undefined,
    subscriptionExpiresAt: subscriptionExpiresAt ?? undefined,
    subscriptionActive: isSubscriptionActive({
      subscriptionExpiresAt: subscriptionExpiresAt,
    }),
    settings,
    capabilities: schoolCapabilities({ productMode, settings }),
    status: (s.status || "active") as "active" | "paused",
    createdAt: s.createdAt
      ? new Date(s.createdAt as Date).getTime()
      : Date.now(),
    updatedAt: s.updatedAt
      ? new Date(s.updatedAt as Date).getTime()
      : undefined,
  };
}
