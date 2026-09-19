import { Doubt, doubtToClient } from "@/lib/models/learning/Doubt";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";

export async function GET(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const className = url.searchParams.get("className") || user.className || "6-B";
  const subject = url.searchParams.get("subject");

  const filter: Record<string, unknown> = {
    className,
  };
  if (user.schoolId) filter.schoolId = user.schoolId;
  if (subject) filter.subject = subject;

  const list = await Doubt.find(filter).sort({ createdAtMs: -1 }).limit(100);
  return jsonOk({
    doubts: list.map(doubtToClient),
  });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("School required", 400);

  const body = (await req.json()) as {
    className?: string;
    subject?: string;
    title?: string;
    body?: string;
    tags?: string[];
  };

  if (!body.title?.trim() || !body.body?.trim()) {
    return jsonError("Title and body are required");
  }

  const d = await Doubt.create({
    schoolId: user.schoolId,
    className: body.className || user.className || "6-B",
    subject: body.subject || "General",
    studentId: String(user._id),
    studentName: user.name,
    title: body.title.trim(),
    body: body.body.trim(),
    tags: body.tags || [],
    isResolved: false,
    answers: [],
    createdAtMs: Date.now(),
  });

  return jsonOk({ doubt: doubtToClient(d) });
}
