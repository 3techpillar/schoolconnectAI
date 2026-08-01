import { inviteToClient } from "@/lib/models/TeacherInvite";
import { TeacherInvite } from "@/lib/models/TeacherInvite";
import { School } from "@/lib/models/School";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import { isSchoolAdminRole } from "@/lib/shared/roles";

function makeInviteCode() {
  const chunk = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TCH-${chunk()}-${chunk()}`;
}

export async function GET() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const filter: Record<string, unknown> = {};
  if (!isSchoolAdminRole(user.role) && user.role !== "principal") {
    return jsonError("Forbidden", 403);
  }
  if (user.role !== "super_admin" && user.schoolId) {
    filter.schoolId = user.schoolId;
  }

  const list = await TeacherInvite.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);
  return jsonOk({ invites: list.map(inviteToClient) });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser(["admin", "super_admin", "principal"]);
  if (error || !user) return error!;

  const body = (await req.json()) as {
    name?: string;
    identifier?: string;
    role?: "class_teacher" | "principal" | "bus_attendant";
    className?: string;
    school?: string;
  };

  const name = (body.name || "").trim();
  const identifier = (body.identifier || "").trim().toLowerCase();
  if (!name || !identifier) {
    return jsonError("name and identifier are required");
  }

  let schoolId = user.schoolId;
  let schoolName = user.schoolName || "";

  if (user.role === "super_admin" && body.school?.trim()) {
    const school = await School.findOne({
      name: new RegExp(
        `^${body.school.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    });
    if (!school) return jsonError("School not found", 404);
    schoolId = school._id;
    schoolName = school.name;
  }

  if (!schoolId) {
    return jsonError("Admin must belong to a school", 400);
  }

  let code = makeInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await TeacherInvite.findOne({ code });
    if (!clash) break;
    code = makeInviteCode();
  }

  const invite = await TeacherInvite.create({
    code,
    name,
    identifier,
    schoolId,
    schoolName,
    role: body.role || "class_teacher",
    className: body.className?.trim() || undefined,
    status: "pending",
    invitedById: user._id,
    invitedByName: user.name,
  });

  return jsonOk({ invite: inviteToClient(invite) }, 201);
}
