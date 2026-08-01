import { inviteToClient, TeacherInvite } from "@/lib/models/TeacherInvite";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "principal",
  ]);
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid invite id");
  }

  const body = (await req.json()) as { status?: "revoked" };
  if (body.status !== "revoked") {
    return jsonError("Only status=revoked is supported");
  }

  const invite = await TeacherInvite.findById(id);
  if (!invite) return jsonError("Not found", 404);
  if (
    user.role !== "super_admin" &&
    user.schoolId &&
    String(invite.schoolId) !== String(user.schoolId)
  ) {
    return jsonError("Forbidden", 403);
  }
  if (invite.status !== "pending") {
    return jsonError("Only pending invites can be revoked");
  }

  invite.status = "revoked";
  await invite.save();
  return jsonOk({ invite: inviteToClient(invite) });
}
