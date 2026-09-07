import {
  StaffProfile,
  staffProfileToClient,
} from "@/lib/models/erp/StaffProfile";
import { TeacherInvite } from "@/lib/models/core/TeacherInvite";
import { User } from "@/lib/models/core/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { erpStaffUpsertSchema } from "@schoolconnect/shared";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const [staff, invites, directory] = await Promise.all([
    StaffProfile.find({ schoolId: scope.schoolId }).sort({ name: 1 }).limit(200),
    TeacherInvite.find({ schoolId: scope.schoolId })
      .sort({ createdAt: -1 })
      .limit(100),
    User.find({
      schoolId: scope.schoolId,
      role: {
        $in: ["class_teacher", "principal", "admin", "bus_attendant"],
      },
    })
      .sort({ name: 1 })
      .limit(200),
  ]);

  return jsonOk({
    staff: staff.map(staffProfileToClient),
    invites: invites.map((i) => ({
      id: String(i._id),
      code: i.code,
      name: i.name,
      identifier: i.identifier,
      role: i.role,
      className: i.className,
      status: i.status,
    })),
    directory: directory.map((u) => ({
      id: String(u._id),
      name: u.name,
      role: u.role,
      identifier: u.identifier,
      className: u.className,
    })),
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const parsed = erpStaffUpsertSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  const scope = resolveErpSchoolId(user, data.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const doc = await StaffProfile.create({
    schoolId: scope.schoolId,
    name: data.name,
    employeeId: data.employeeId,
    designation: data.designation || "",
    subjects: data.subjects || [],
    classSectionIds: (data.classSectionIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    ),
    phone: data.phone || "",
    email: data.email || "",
    userId: data.userId || undefined,
    status: data.status || "active",
  });

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "create",
    entityType: "StaffProfile",
    entityId: String(doc._id),
  });

  return jsonOk({ staff: staffProfileToClient(doc) }, 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("id is required");
  }
  const doc = await StaffProfile.findById(id);
  if (!doc) return jsonError("Staff not found", 404);

  const scope = resolveErpSchoolId(user, String(doc.schoolId));
  if (scope.error) return scope.error;

  const parsed = erpStaffUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  if (data.name !== undefined) doc.name = data.name;
  if (data.employeeId !== undefined) doc.employeeId = data.employeeId;
  if (data.designation !== undefined) doc.designation = data.designation;
  if (data.subjects !== undefined) doc.subjects = data.subjects;
  if (data.phone !== undefined) doc.phone = data.phone;
  if (data.email !== undefined) doc.email = data.email;
  if (data.status !== undefined) doc.status = data.status;
  if (data.userId !== undefined) doc.userId = data.userId as never;
  if (data.classSectionIds !== undefined) {
    doc.classSectionIds = data.classSectionIds.filter((x) =>
      mongoose.Types.ObjectId.isValid(x),
    ) as never;
  }
  await doc.save();

  await writeErpAudit({
    user,
    schoolId: doc.schoolId,
    action: "update",
    entityType: "StaffProfile",
    entityId: String(doc._id),
  });

  return jsonOk({ staff: staffProfileToClient(doc) });
});
