import { ParentStudentLink, linkToClient } from "@/lib/models/ParentStudentLink";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";
import { parseBodyWithSchema } from "@/lib/server/validate";
import { isSchoolAdminRole } from "@/lib/shared/roles";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["active", "revoked", "pending"]).optional(),
  primary: z.boolean().optional(),
  relationship: z
    .enum(["father", "mother", "guardian", "other"])
    .optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function patchHandler(req: Request, ctx: Ctx) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!id) return jsonError("Missing id", 400);

  const link = await ParentStudentLink.findById(id);
  if (!link) return jsonError("Link not found", 404);

  const isParty =
    String(link.parentUserId) === String(user._id) ||
    String(link.studentUserId) === String(user._id);
  const staff =
    isSchoolAdminRole(user.role) ||
    user.role === "principal" ||
    user.role === "class_teacher";
  if (!isParty && !staff) return jsonError("Forbidden", 403);

  const parsed = await parseBodyWithSchema(req, patchSchema);
  if ("error" in parsed) return parsed.error;

  if (parsed.data.status) link.status = parsed.data.status;
  if (typeof parsed.data.primary === "boolean") {
    link.primary = parsed.data.primary;
  }
  if (parsed.data.relationship) link.relationship = parsed.data.relationship;
  await link.save();

  return jsonOk({ link: linkToClient(link) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  return withApiHandler((r) => patchHandler(r, ctx))(req);
}
