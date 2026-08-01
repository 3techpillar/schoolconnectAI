import { User, userToClient, USER_ROLES } from "@/lib/models/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user: actor } = await requireUser([
    "admin",
    "super_admin",
    "principal",
  ]);
  if (error || !actor) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid user id");
  }

  const body = (await req.json()) as {
    role?: string;
    className?: string;
    enrollmentStatus?: "pending" | "approved" | "rejected";
  };

  const target = await User.findById(id);
  if (!target) return jsonError("User not found", 404);

  if (
    actor.role !== "super_admin" &&
    actor.schoolId &&
    String(target.schoolId) !== String(actor.schoolId)
  ) {
    return jsonError("Forbidden", 403);
  }

  if (body.role) {
    if (!USER_ROLES.includes(body.role as (typeof USER_ROLES)[number])) {
      return jsonError("Invalid role");
    }
    if (body.role === "super_admin" && actor.role !== "super_admin") {
      return jsonError("Only super admin can assign super_admin", 403);
    }
    if (actor.role === "principal" && body.role === "admin") {
      return jsonError("Principal cannot assign admin", 403);
    }
    target.role = body.role as typeof target.role;
  }

  if (body.className !== undefined) {
    target.className = body.className.trim() || undefined;
  }
  if (body.enrollmentStatus) {
    target.enrollmentStatus = body.enrollmentStatus;
  }

  await target.save();
  return jsonOk({ user: userToClient(target) });
}
