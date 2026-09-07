import { Chat, chatToClient } from "@/lib/models/comms/Chat";
import { Message, messageToClient } from "@/lib/models/comms/Message";
import { jsonError, jsonOk } from "@/lib/server/response";
import { requireUser } from "@/lib/server/http";
import {
  ensureWelcomeMessage,
} from "@/lib/server/services/chat-service";
import { ensureSchoolDemoData } from "@/lib/server/services/seed-school";
import { parseBodyWithSchema } from "@/lib/server/validate";
import { chatUpsertSchema } from "@/lib/server/schemas";

export async function GET() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonOk({ chats: [], messagesByChat: {} });

  await ensureSchoolDemoData(user.schoolId);

  const chats = await Chat.find({ schoolId: user.schoolId }).sort({
    pinned: -1,
    lastMessageAt: -1,
  });
  const messages = await Message.find({ schoolId: user.schoolId })
    .sort({ createdAtMs: 1 })
    .limit(2000);

  const messagesByChat: Record<string, ReturnType<typeof messageToClient>[]> =
    {};
  for (const m of messages) {
    const list = messagesByChat[m.chatSlug] || [];
    list.push(messageToClient(m));
    messagesByChat[m.chatSlug] = list;
  }

  const uid = String(user._id);
  return jsonOk({
    chats: chats.map((c) => chatToClient(c, uid)),
    messagesByChat,
  });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const parsed = await parseBodyWithSchema(req, chatUpsertSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const chat = await Chat.findOneAndUpdate(
    { schoolId: user.schoolId, slug: body.slug },
    {
      $setOnInsert: {
        schoolId: user.schoolId,
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle || "",
        kind: body.kind,
        className: body.className,
        avatar: body.avatar || "?",
        lastMessageAt: Date.now(),
      },
    },
    { upsert: true, new: true },
  );

  if (chat) {
    await ensureWelcomeMessage(user.schoolId, chat, user);
  }

  return jsonOk({ chat: chatToClient(chat!, String(user._id)) });
}
