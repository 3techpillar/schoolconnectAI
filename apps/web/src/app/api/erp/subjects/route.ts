import { Subject, subjectToClient } from "@/lib/models/erp/Subject";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { erpSubjectUpsertSchema } from "@schoolconnect/shared";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const className = url.searchParams.get("className");
  const filter: Record<string, unknown> = { schoolId: scope.schoolId };
  if (className) filter.className = className;

  const subjects = await Subject.find(filter).sort({ className: 1, code: 1 }).limit(300);
  return jsonOk({ subjects: subjects.map(subjectToClient) });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const parsed = erpSubjectUpsertSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  const scope = resolveErpSchoolId(user, data.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const doc = await Subject.create({
    schoolId: scope.schoolId,
    code: data.code.toUpperCase(),
    name: data.name,
    className: data.className || "",
    teacherUserId: data.teacherUserId || undefined,
    teacherName: data.teacherName || "",
    mandatory: data.mandatory ?? true,
    active: data.active ?? true,
  });

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "create",
    entityType: "Subject",
    entityId: String(doc._id),
  });

  return jsonOk({ subject: subjectToClient(doc) }, 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("id required");

  const doc = await Subject.findById(id);
  if (!doc) return jsonError("Subject not found", 404);

  const scope = resolveErpSchoolId(user, String(doc.schoolId));
  if (scope.error) return scope.error;

  const parsed = erpSubjectUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  if (data.code !== undefined) doc.code = data.code.toUpperCase();
  if (data.name !== undefined) doc.name = data.name;
  if (data.className !== undefined) doc.className = data.className;
  if (data.teacherName !== undefined) doc.teacherName = data.teacherName;
  if (data.teacherUserId !== undefined) {
    doc.teacherUserId = data.teacherUserId as never;
  }
  if (data.mandatory !== undefined) doc.mandatory = data.mandatory;
  if (data.active !== undefined) doc.active = data.active;
  await doc.save();

  await writeErpAudit({
    user,
    schoolId: doc.schoolId,
    action: "update",
    entityType: "Subject",
    entityId: String(doc._id),
  });

  return jsonOk({ subject: subjectToClient(doc) });
});
