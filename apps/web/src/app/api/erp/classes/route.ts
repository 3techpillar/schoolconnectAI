import {
  ClassModel,
  classSectionToClient,
} from "@/lib/models/core/Class";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { erpClassUpsertSchema } from "@schoolconnect/shared";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const classes = await ClassModel.find({ schoolId: scope.schoolId })
    .sort({ grade: 1, section: 1 })
    .limit(200);
  return jsonOk({ classes: classes.map(classSectionToClient) });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = await req.json();
  const parsed = erpClassUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }

  const scope = resolveErpSchoolId(user, parsed.data.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const grade = parsed.data.grade;
  const section = parsed.data.section.toUpperCase();
  const className = parsed.data.className || `${grade}-${section}`;

  const existing = await ClassModel.findOne({
    schoolId: scope.schoolId,
    className,
  });
  if (existing) return jsonError("Class already exists", 409);

  const doc = await ClassModel.create({
    schoolId: scope.schoolId,
    grade,
    section,
    className,
    classTeacherId: parsed.data.classTeacherId || undefined,
    capacity: parsed.data.capacity ?? 40,
  });

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "create",
    entityType: "ClassSection",
    entityId: String(doc._id),
  });

  return jsonOk({ class: classSectionToClient(doc) }, 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("id is required");
  }

  const doc = await ClassModel.findById(id);
  if (!doc) return jsonError("Class not found", 404);

  const scope = resolveErpSchoolId(user, String(doc.schoolId));
  if (scope.error) return scope.error;

  const parsed = erpClassUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  if (data.grade !== undefined) doc.grade = data.grade;
  if (data.section !== undefined) doc.section = data.section.toUpperCase();
  if (data.className !== undefined) doc.className = data.className;
  else if (data.grade || data.section) {
    doc.className = `${doc.grade}-${doc.section}`;
  }
  if (data.capacity !== undefined) doc.capacity = data.capacity;
  if (data.classTeacherId !== undefined) {
    doc.classTeacherId = data.classTeacherId
      ? (data.classTeacherId as never)
      : undefined;
  }
  if (data.periods !== undefined) {
    doc.periods = data.periods as typeof doc.periods;
  }
  await doc.save();

  await writeErpAudit({
    user,
    schoolId: doc.schoolId,
    action: "update",
    entityType: "ClassSection",
    entityId: String(doc._id),
  });

  return jsonOk({ class: classSectionToClient(doc) });
});
