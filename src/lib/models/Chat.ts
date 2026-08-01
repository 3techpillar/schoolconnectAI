import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ChatSchema = new Schema(
  {
    slug: { type: String, required: true, index: true },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    kind: {
      type: String,
      enum: ["class", "teacher", "school", "bus"],
      required: true,
    },
    className: { type: String },
    avatar: { type: String, default: "?" },
    pinned: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
    lastMessageAt: { type: Number, default: () => Date.now() },
    unreadBy: { type: [String], default: [] },
    /** Per-user unread message counts */
    unreadCounts: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

ChatSchema.index({ schoolId: 1, slug: 1 }, { unique: true });

export type ChatDoc = InferSchemaType<typeof ChatSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Chat: Model<ChatDoc> =
  mongoose.models.Chat || mongoose.model<ChatDoc>("Chat", ChatSchema);

export function chatToClient(c: ChatDoc, userId?: string) {
  const counts = (c.unreadCounts || {}) as Record<string, number>;
  const fromCounts = userId ? counts[userId] || 0 : 0;
  const flagged =
    userId && (c.unreadBy || []).includes(userId) ? Math.max(1, fromCounts) : 0;
  return {
    id: c.slug,
    title: c.title,
    subtitle: c.subtitle || "",
    kind: c.kind as "class" | "teacher" | "school" | "bus",
    className: c.className || undefined,
    avatar: c.avatar || "?",
    pinned: Boolean(c.pinned),
    muted: Boolean(c.muted),
    lastMessageAt: c.lastMessageAt || Date.now(),
    unread: fromCounts || flagged,
  };
}
