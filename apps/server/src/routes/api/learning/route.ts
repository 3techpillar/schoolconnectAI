import { StudyMaterial, studyMaterialToClient } from "@/lib/models/learning/StudyMaterial";
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

  const materials = await StudyMaterial.find(filter).sort({ createdAtMs: -1 }).limit(100);
  return jsonOk({
    materials: materials.map(studyMaterialToClient),
  });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser([
    "class_teacher",
    "subject_teacher",
    "principal",
    "admin",
    "super_admin",
  ]);
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("School required", 400);

  const body = (await req.json()) as {
    className?: string;
    subject?: string;
    title?: string;
    description?: string;
    chapter?: string;
    kind?: "pdf" | "video" | "link" | "notes" | "quiz";
    fileUrl?: string;
  };

  if (!body.title?.trim() || !body.subject?.trim()) {
    return jsonError("Title and subject are required");
  }

  const mat = await StudyMaterial.create({
    schoolId: user.schoolId,
    className: body.className || user.className || "6-B",
    subject: body.subject.trim(),
    title: body.title.trim(),
    description: body.description || "",
    chapter: body.chapter || "General",
    kind: body.kind || "pdf",
    fileUrl: body.fileUrl || "",
    uploadedBy: user.name,
    uploadedById: String(user._id),
    createdAtMs: Date.now(),
  });

  return jsonOk({ material: studyMaterialToClient(mat) });
}
