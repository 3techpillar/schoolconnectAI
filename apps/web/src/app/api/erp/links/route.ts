import { ParentStudentLink, linkToClient } from "@/lib/models/family/ParentStudentLink";
import { User } from "@/lib/models/core/User";
import { StudentProfile } from "@/lib/models/erp/StudentProfile";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { ensureParentStudentLink } from "@/lib/server/services/link-service";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const links = await ParentStudentLink.find({ schoolId: scope.schoolId })
    .sort({ createdAt: -1 })
    .limit(300);

  const parentIds = [...new Set(links.map((l) => String(l.parentUserId)))];
  const studentIds = [...new Set(links.map((l) => String(l.studentUserId)))];
  const users = await User.find({
    _id: { $in: [...parentIds, ...studentIds] },
  })
    .select("name role identifier")
    .lean();
  const nameById = Object.fromEntries(
    users.map((u) => [String(u._id), { name: u.name, role: u.role, identifier: u.identifier }]),
  );

  return jsonOk({
    links: links.map((l) => ({
      ...linkToClient(l),
      parentName: nameById[String(l.parentUserId)]?.name,
      studentName: nameById[String(l.studentUserId)]?.name,
    })),
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as {
    parentUserId?: string;
    studentUserId?: string;
    studentProfileId?: string;
    relationship?: "father" | "mother" | "guardian" | "other";
    schoolId?: string;
  };

  const scope = resolveErpSchoolId(user, body.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  let studentUserId = body.studentUserId;
  if (!studentUserId && body.studentProfileId) {
    const profile = await StudentProfile.findById(body.studentProfileId);
    studentUserId = profile?.userId ? String(profile.userId) : undefined;
  }
  if (!body.parentUserId || !studentUserId) {
    return jsonError("parentUserId and studentUserId required");
  }
  if (
    !mongoose.Types.ObjectId.isValid(body.parentUserId) ||
    !mongoose.Types.ObjectId.isValid(studentUserId)
  ) {
    return jsonError("Invalid user ids");
  }

  const result = await ensureParentStudentLink({
    schoolId: new mongoose.Types.ObjectId(scope.schoolId),
    parentUserId: new mongoose.Types.ObjectId(body.parentUserId),
    studentUserId: new mongoose.Types.ObjectId(studentUserId),
    relationship: body.relationship || "guardian",
    primary: true,
  });

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "create",
    entityType: "ParentStudentLink",
    entityId: String(result.link._id),
  });

  return jsonOk({ link: linkToClient(result.link) }, 201);
});
