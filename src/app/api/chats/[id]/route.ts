import { Chat, chatToClient } from "@/lib/models/Chat";
import { Message, messageToClient } from "@/lib/models/Message";
import { jsonError, jsonOk } from "@/lib/server/response";
import {
  clearUnreadForUser,
  postChatMessage,
} from "@/lib/server/chat-service";
import { requireUser } from "@/lib/server/http";
import { parseBodyWithSchema } from "@/lib/server/validate";
import { chatPostMessageSchema } from "@/lib/server/schemas";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const { id: chatSlug } = await ctx.params;
  const chat = await Chat.findOne({ schoolId: user.schoolId, slug: chatSlug });
  if (!chat) return jsonError("Chat not found", 404);

  const messages = await Message.find({
    schoolId: user.schoolId,
    chatSlug,
  }).sort({ createdAtMs: 1 });

  return jsonOk({
    chat: chatToClient(chat, String(user._id)),
    messages: messages.map(messageToClient),
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const { id: chatSlug } = await ctx.params;
  const parsed = await parseBodyWithSchema(req, chatPostMessageSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const result = await postChatMessage(user, {
      chatSlug,
      text: parsed.data.text.trim(),
      kind: parsed.data.kind || "text",
      meta: parsed.data.meta,
      syncHomework: parsed.data.syncHomework,
    });
    return jsonOk(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send";
    const status =
      msg === "Chat not found"
        ? 404
        : msg.includes("Only teachers")
          ? 403
          : 400;
    return jsonError(msg, status);
  }
}

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const { id: chatSlug } = await ctx.params;
  const uid = String(user._id);
  const chat = await clearUnreadForUser(user.schoolId, chatSlug, uid);
  if (!chat) return jsonError("Chat not found", 404);

  await Message.updateMany(
    { schoolId: user.schoolId, chatSlug, readBy: { $ne: uid } },
    { $addToSet: { readBy: uid } },
  );

  return jsonOk({ chat: chatToClient(chat, uid) });
}
