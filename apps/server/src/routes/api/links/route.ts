import { User } from "@/lib/models/core/User";
import { linkToClient } from "@/lib/models/family/ParentStudentLink";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";
import {
  ensureParentStudentLink,
  listLinksForUser,
} from "@/lib/server/services/link-service";
import { parseBodyWithSchema } from "@/lib/server/validate";
import { isSchoolAdminRole } from "@/lib/shared/roles";
import { z } from "zod";

const createLinkSchema = z.object({
  studentIdentifier: z.string().trim().min(3).optional(),
  studentUserId: z.string().trim().min(1).optional(),
  /** Staff-only: which parent to attach */
  parentUserId: z.string().trim().min(1).optional(),
  relationship: z
    .enum(["father", "mother", "guardian", "other"])
    .optional()
    .default("guardian"),
  note: z.string().trim().max(200).optional(),
});

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  const links = await listLinksForUser(user);
  return jsonOk({ links });
}

async function postHandler(req: Request) {
  const { error, user } = await requireUser([
    "parent",
    "admin",
    "super_admin",
    "principal",
    "class_teacher",
  ]);
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const parsed = await parseBodyWithSchema(req, createLinkSchema);
  if ("error" in parsed) return parsed.error;

  let student = null as InstanceType<typeof User> | null;
  if (parsed.data.studentUserId) {
    student = await User.findById(parsed.data.studentUserId);
  } else if (parsed.data.studentIdentifier) {
    student = await User.findOne({
      identifier: parsed.data.studentIdentifier.trim().toLowerCase(),
      role: "student",
    });
  } else {
    return jsonError("studentIdentifier or studentUserId is required", 400);
  }

  if (!student || student.role !== "student") {
    return jsonError("Student not found", 404);
  }

  const staff = isSchoolAdminRole(user.role) || user.role === "principal" || user.role === "class_teacher";
  let parent = user;

  if (user.role === "parent") {
    if (
      student.schoolId &&
      String(student.schoolId) !== String(user.schoolId)
    ) {
      return jsonError("Student belongs to another school", 403);
    }
  } else if (staff) {
    if (!parsed.data.parentUserId) {
      return jsonError("parentUserId is required for staff linking", 400);
    }
    const found = await User.findById(parsed.data.parentUserId);
    if (!found || found.role !== "parent") {
      return jsonError("Parent not found", 404);
    }
    parent = found;
  } else {
    return jsonError("Forbidden", 403);
  }

  const { link, created } = await ensureParentStudentLink({
    schoolId: student.schoolId || user.schoolId,
    parentUserId: parent._id,
    studentUserId: student._id,
    relationship: parsed.data.relationship,
    note:
      parsed.data.note ||
      (user.role === "parent" ? "Parent self-link" : `Linked by ${user.name}`),
  });

  if (parent.role === "parent") {
    parent.childName = student.name;
    if (!parent.className && student.className) {
      parent.className = student.className;
    }
    await parent.save();
  }

  return jsonOk(
    {
      link: linkToClient(link),
      created,
      student: {
        id: String(student._id),
        name: student.name,
        className: student.className,
      },
    },
    created ? 201 : 200,
  );
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
