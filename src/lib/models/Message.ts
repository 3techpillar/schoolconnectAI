import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MessageSchema = new Schema(
  {
    chatSlug: { type: String, required: true, index: true },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["text", "daily_activity", "homework", "progress", "system"],
      default: "text",
    },
    text: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    meta: {
      subject: String,
      due: String,
      status: String,
      score: String,
      activityDate: String,
    },
    createdAtMs: { type: Number, default: () => Date.now(), index: true },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type MessageDoc = InferSchemaType<typeof MessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Message: Model<MessageDoc> =
  mongoose.models.Message ||
  mongoose.model<MessageDoc>("Message", MessageSchema);

export function messageToClient(m: MessageDoc) {
  return {
    id: String(m._id),
    chatId: m.chatSlug,
    kind: m.kind as
      | "text"
      | "daily_activity"
      | "homework"
      | "progress"
      | "system",
    text: m.text,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    createdAt: m.createdAtMs || Date.now(),
    readBy: m.readBy || [],
    meta: m.meta
      ? {
          subject: m.meta.subject || undefined,
          due: m.meta.due || undefined,
          status: m.meta.status as
            | "pending"
            | "in-progress"
            | "submitted"
            | "reviewed"
            | undefined,
          score: m.meta.score || undefined,
          activityDate: m.meta.activityDate || undefined,
        }
      : undefined,
  };
}
