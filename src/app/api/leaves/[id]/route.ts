import { Leave, leaveToClient } from "@/lib/models/Leave";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser([
    "class_teacher",
    "principal",
    "admin",
    "super_admin",
  ]);
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid leave id");
  }

  const body = (await req.json()) as {
    status?: "approved" | "rejected";
    note?: string;
  };
  if (!body.status) return jsonError("status is required");

  const leave = await Leave.findById(id);
  if (!leave) return jsonError("Not found", 404);
  if (
    user.schoolId &&
    String(leave.schoolId) !== String(user.schoolId) &&
    user.role !== "super_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  leave.status = body.status;
  leave.reviewedBy = user.name;
  leave.reviewedAt = Date.now();
  if (body.note?.trim()) leave.note = body.note.trim();
  await leave.save();

  return jsonOk({ leave: leaveToClient(leave) });
}
