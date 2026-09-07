import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ErpAuditLogSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

ErpAuditLogSchema.index({ createdAt: -1 });

export type ErpAuditLogDoc = InferSchemaType<typeof ErpAuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ErpAuditLog: Model<ErpAuditLogDoc> =
  mongoose.models.ErpAuditLog ||
  mongoose.model<ErpAuditLogDoc>("ErpAuditLog", ErpAuditLogSchema);

export function erpAuditLogToClient(a: ErpAuditLogDoc) {
  return {
    id: String(a._id),
    schoolId: a.schoolId ? String(a.schoolId) : undefined,
    actorUserId: String(a.actorUserId),
    actorName: a.actorName,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId || "",
    meta: (a.meta || {}) as Record<string, unknown>,
    createdAt: a.createdAt
      ? new Date(a.createdAt as Date).getTime()
      : Date.now(),
  };
}
