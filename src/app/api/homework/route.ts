import { Homework, homeworkToClient } from "@/lib/models/Homework";
import { Message } from "@/lib/models/Message";
import { Chat } from "@/lib/models/Chat";
import { Notification } from "@/lib/models/Notification";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { bumpUnreadForSchool } from "@/lib/server/chat-service";
import { requireUser } from "@/lib/server/http";
import { ensureSchoolDemoData } from "@/lib/server/seed-school";
import { addDaysIso, formatDueLabel, toIsoDate } from "@/lib/shared/dates";

export async function GET() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  await ensureSchoolDemoData(user.schoolId);
  const filter: Record<string, unknown> = { schoolId: user.schoolId };
  if (user.className && (user.role === "student" || user.role === "parent")) {
    filter.className = user.className;
  }

  const list = await Homework.find(filter).sort({ createdAtMs: -1 }).limit(200);
  return jsonOk({
    homework: list.map((h) => {
      const item = homeworkToClient(h);
      return {
        ...item,
        due: item.dueDate
          ? formatDueLabel(item.dueDate, item.due)
          : item.due,
      };
    }),
  });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser([
    "class_teacher",
    "principal",
  ]);
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const body = (await req.json()) as {
    subject?: string;
    title?: string;
    due?: string;
    dueDate?: string;
    priority?: "high" | "medium" | "low";
    attachments?: number;
    status?: string;
    className?: string;
    notes?: string;
    syncChat?: boolean;
  };

  if (!body.subject?.trim() || !body.title?.trim()) {
    return jsonError("subject and title are required");
  }

  const dueDate =
    body.dueDate ||
    (body.due && /^\d{4}-\d{2}-\d{2}$/.test(body.due)
      ? body.due
      : addDaysIso(toIsoDate(), 2));

  const hw = await Homework.create({
    schoolId: user.schoolId,
    subject: body.subject.trim(),
    title: body.title.trim(),
    dueDate,
    due: formatDueLabel(dueDate, body.due),
    priority: body.priority || "medium",
    attachments: body.attachments || 0,
    status: (body.status as never) || "pending",
    className: body.className || user.className || "6-B",
    postedBy: user.name,
    postedById: String(user._id),
    notes: body.notes,
    createdAtMs: Date.now(),
  });

  if (body.syncChat !== false) {
    const classChat =
      (await Chat.findOne({
        schoolId: user.schoolId,
        kind: "class",
        className: hw.className,
      })) ||
      (await Chat.findOne({ schoolId: user.schoolId, kind: "class" }));

    if (classChat) {
      const createdAtMs = Date.now();
      await Message.create({
        chatSlug: classChat.slug,
        schoolId: user.schoolId,
        kind: "homework",
        text: `Homework posted: ${hw.title}`,
        senderId: String(user._id),
        senderName: user.name,
        senderRole: user.role,
        meta: {
          subject: hw.subject,
          due: hw.due,
          status: hw.status,
        },
        createdAtMs,
        readBy: [String(user._id)],
      });
      await bumpUnreadForSchool(
        user.schoolId,
        classChat.slug,
        String(user._id),
        createdAtMs,
      );
    }

    await Notification.create({
      schoolId: user.schoolId,
      title: `Homework · ${hw.subject}`,
      body: hw.title,
      type: "homework",
      href: "/homework",
      createdAtMs: Date.now(),
      readBy: [String(user._id)],
    });
  }

  return jsonOk({ homework: homeworkToClient(hw) }, 201);
}
