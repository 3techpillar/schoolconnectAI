import { School, schoolToClient } from "@/lib/models/core/School";
import { AcademicSession, academicSessionToClient } from "@/lib/models/erp/AcademicSession";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { isSuperAdminRole } from "@/lib/shared/roles";
import { erpSchoolUpsertSchema } from "@schoolconnect/shared";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;

  if (isSuperAdminRole(user.role) && !scope.schoolId) {
    const schools = await School.find().sort({ name: 1 }).limit(200);
    return jsonOk({ schools: schools.map(schoolToClient) });
  }

  if (!scope.schoolId || !mongoose.Types.ObjectId.isValid(scope.schoolId)) {
    return jsonError("schoolId required", 400);
  }

  const school = await School.findById(scope.schoolId);
  if (!school) return jsonError("School not found", 404);
  const sessions = await AcademicSession.find({ schoolId: school._id })
    .sort({ label: -1 })
    .limit(20);
  return jsonOk({
    schools: [schoolToClient(school)],
    sessions: sessions.map(academicSessionToClient),
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;
  if (!isSuperAdminRole(user.role)) {
    return jsonError("Only super admin can create schools", 403);
  }

  const parsed = erpSchoolUpsertSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  const school = await School.create({
    name: data.name,
    code: data.code?.toUpperCase() || undefined,
    city: data.city || "",
    board: data.board || "",
    address: data.address || "",
    phone: data.phone || "",
    email: data.email || "",
    academicYearCurrent: data.academicYearCurrent || "2025-26",
    productMode: data.productMode || "connect",
    branchName: data.branchName || "",
    groupCode: data.groupCode?.toUpperCase() || "",
    transferPolicy: data.transferPolicy || "group_only",
    subscriptionPlan: data.subscriptionPlan || "free",
    subscriptionStartsAt: new Date(),
    subscriptionExpiresAt: data.subscriptionExpiresAt
      ? new Date(data.subscriptionExpiresAt)
      : undefined,
    settings: data.settings || {},
    status: data.status || "active",
  });

  await AcademicSession.create({
    schoolId: school._id,
    label: school.academicYearCurrent || "2025-26",
    status: "active",
  });

  await writeErpAudit({
    user,
    schoolId: school._id,
    action: "create",
    entityType: "School",
    entityId: String(school._id),
  });

  return jsonOk({ school: schoolToClient(school) }, 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("id is required");
  }

  const scope = resolveErpSchoolId(user, id);
  if (scope.error) return scope.error;

  const school = await School.findById(id);
  if (!school) return jsonError("School not found", 404);

  const parsed = erpSchoolUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  if (data.name !== undefined) school.name = data.name;
  if (data.code !== undefined) school.code = data.code.toUpperCase();
  if (data.city !== undefined) school.city = data.city;
  if (data.board !== undefined) school.board = data.board;
  if (data.address !== undefined) school.address = data.address;
  if (data.phone !== undefined) school.phone = data.phone;
  if (data.email !== undefined) school.email = data.email;
  if (data.academicYearCurrent !== undefined) {
    school.academicYearCurrent = data.academicYearCurrent;
  }
  if (data.productMode !== undefined) {
    if (!isSuperAdminRole(user.role)) {
      return jsonError("Only super admin can change product mode", 403);
    }
    school.productMode = data.productMode;
  }
  if (data.branchName !== undefined) school.branchName = data.branchName;
  if (data.groupCode !== undefined) {
    school.groupCode = data.groupCode.toUpperCase();
  }
  if (data.transferPolicy !== undefined) {
    school.transferPolicy = data.transferPolicy;
  }
  if (data.subscriptionPlan !== undefined) {
    school.subscriptionPlan = data.subscriptionPlan;
  }
  if (data.subscriptionExpiresAt !== undefined) {
    school.subscriptionExpiresAt = new Date(data.subscriptionExpiresAt);
  }
  if (data.settings !== undefined) {
    school.settings = {
      ...(typeof school.settings === "object" && school.settings
        ? school.settings
        : {}),
      ...data.settings,
    };
  }
  if (data.status !== undefined) school.status = data.status;
  await school.save();

  await writeErpAudit({
    user,
    schoolId: school._id,
    action: "update",
    entityType: "School",
    entityId: String(school._id),
  });

  return jsonOk({ school: schoolToClient(school) });
});
