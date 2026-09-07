import { Chat, chatToClient, type ChatDoc } from "@/lib/models/comms/Chat";
import { Message, messageToClient } from "@/lib/models/comms/Message";
import { Homework } from "@/lib/models/comms/Homework";
import { Notification } from "@/lib/models/comms/Notification";
import { User, type UserDoc } from "@/lib/models/core/User";
import { addDaysIso, formatDueLabel, toIsoDate } from "@/lib/shared/dates";
import type { Types } from "mongoose";

const RICH_KINDS = new Set(["homework", "daily_activity", "progress"]);

export function canPostRichChat(role: string) {
  return role === "class_teacher" || role === "principal" || role === "admin" || role === "super_admin";
}

/** Mark chat unread for everyone in the school except the sender. */
export async function bumpUnreadForSchool(
  schoolId: Types.ObjectId,
  chatSlug: string,
  senderId: string,
  lastMessageAt: number,
) {
  const others = await User.find({
    schoolId,
    _id: { $ne: senderId },
  })
    .select("_id")
    .lean();
  const ids = others.map((u) => String(u._id));

  const chat = await Chat.findOne({ schoolId, slug: chatSlug });
  if (!chat) return null;

  const counts = {
    ...((chat.unreadCounts || {}) as Record<string, number>),
  };
  for (const id of ids) {
    counts[id] = (counts[id] || 0) + 1;
  }
  counts[senderId] = 0;

  const unreadBy = Array.from(
    new Set([...(chat.unreadBy || []).filter((id) => id !== senderId), ...ids]),
  );

  chat.lastMessageAt = lastMessageAt;
  chat.unreadBy = unreadBy;
  chat.set("unreadCounts", counts);
  await chat.save();
  return chat;
}

export async function clearUnreadForUser(
  schoolId: Types.ObjectId,
  chatSlug: string,
  userId: string,
) {
  const chat = await Chat.findOne({ schoolId, slug: chatSlug });
  if (!chat) return null;
  chat.unreadBy = (chat.unreadBy || []).filter((id) => id !== userId);
  const counts = {
    ...((chat.unreadCounts || {}) as Record<string, number>),
  };
  counts[userId] = 0;
  chat.set("unreadCounts", counts);
  await chat.save();
  return chat;
}

export type PostChatInput = {
  chatSlug: string;
  text: string;
  kind: "text" | "daily_activity" | "homework" | "progress" | "system";
  meta?: {
    subject?: string;
    due?: string;
    status?: string;
    score?: string;
    activityDate?: string;
  };
  syncHomework?: boolean;
};

export async function postChatMessage(user: UserDoc, input: PostChatInput) {
  if (!user.schoolId) throw new Error("User has no school");

  const chat = await Chat.findOne({
    schoolId: user.schoolId,
    slug: input.chatSlug,
  });
  if (!chat) throw new Error("Chat not found");

  if (RICH_KINDS.has(input.kind) && !canPostRichChat(user.role)) {
    throw new Error("Only teachers can post activity, homework, or progress");
  }
  if (input.kind === "system") {
    throw new Error("Invalid message kind");
  }

  const createdAtMs = Date.now();
  const msg = await Message.create({
    chatSlug: input.chatSlug,
    schoolId: user.schoolId,
    kind: input.kind,
    text: input.text,
    senderId: String(user._id),
    senderName: user.name,
    senderRole: user.role,
    meta: input.meta,
    createdAtMs,
    readBy: [String(user._id)],
  });

  const updated = await bumpUnreadForSchool(
    user.schoolId,
    input.chatSlug,
    String(user._id),
    createdAtMs,
  );

  if (RICH_KINDS.has(input.kind)) {
    await Notification.create({
      schoolId: user.schoolId,
      title:
        input.kind === "homework"
          ? `Homework · ${input.meta?.subject || "Class"}`
          : input.kind === "daily_activity"
            ? `Daily activity · ${input.meta?.subject || "Class"}`
            : `Progress · ${input.meta?.subject || "Update"}`,
      body: input.text.slice(0, 120),
      type:
        input.kind === "homework"
          ? "homework"
          : input.kind === "daily_activity"
            ? "activity"
            : "progress",
      href: `/chats/${input.chatSlug}`,
      createdAtMs,
      readBy: [String(user._id)],
    });
  }

  let homeworkId: string | null = null;
  if (
    input.syncHomework !== false &&
    input.kind === "homework" &&
    input.meta?.subject
  ) {
    const dueDate =
      input.meta.due && /^\d{4}-\d{2}-\d{2}$/.test(input.meta.due)
        ? input.meta.due
        : addDaysIso(toIsoDate(), 2);
    const hw = await Homework.create({
      schoolId: user.schoolId,
      subject: input.meta.subject,
      title: input.text.replace(/^Homework posted:\s*/i, ""),
      dueDate,
      due: formatDueLabel(dueDate, input.meta.due || "This week"),
      priority: "medium",
      attachments: 0,
      status: (input.meta.status as never) || "pending",
      className: user.className || chat.className || "6-B",
      postedBy: user.name,
      postedById: String(user._id),
      createdAtMs,
    });
    homeworkId = String(hw._id);
  }

  return {
    message: messageToClient(msg),
    chat: updated
      ? chatToClient(updated, String(user._id))
      : chatToClient(chat, String(user._id)),
    homeworkId,
  };
}

export async function ensureWelcomeMessage(
  schoolId: Types.ObjectId,
  chat: ChatDoc,
  actor: UserDoc,
) {
  const count = await Message.countDocuments({
    schoolId,
    chatSlug: chat.slug,
  });
  if (count > 0) return;
  const createdAtMs = Date.now();
  await Message.create({
    chatSlug: chat.slug,
    schoolId,
    kind: "system",
    text: `Chat started with ${chat.title}.`,
    senderId: "system",
    senderName: "SchoolConnect",
    senderRole: "system",
    createdAtMs,
    readBy: [String(actor._id)],
  });
  await Chat.updateOne(
    { _id: chat._id },
    { $set: { lastMessageAt: createdAtMs } },
  );
}
