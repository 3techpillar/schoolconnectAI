import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NotificationSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "homework",
        "activity",
        "progress",
        "fees",
        "circular",
        "chat",
        "system",
        "bus",
      ],
      default: "system",
    },
    href: { type: String },
    readBy: { type: [String], default: [] },
    createdAtMs: { type: Number, default: () => Date.now(), index: true },
  },
  { timestamps: true },
);

export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification: Model<NotificationDoc> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDoc>("Notification", NotificationSchema);

export function notificationToClient(n: NotificationDoc, userId?: string) {
  return {
    id: String(n._id),
    title: n.title,
    body: n.body,
    createdAt: n.createdAtMs || Date.now(),
    read: userId ? (n.readBy || []).includes(userId) : false,
    type: n.type as
      | "homework"
      | "activity"
      | "progress"
      | "fees"
      | "circular"
      | "chat"
      | "system"
      | "bus",
    href: n.href || undefined,
  };
}
