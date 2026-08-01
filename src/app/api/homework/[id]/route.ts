import { Homework, homeworkToClient } from "@/lib/models/Homework";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid homework id");
  }

  const body = (await req.json()) as {
    status?: "pending" | "in-progress" | "submitted" | "reviewed";
  };
  if (!body.status) return jsonError("status is required");

  const hw = await Homework.findById(id);
  if (!hw) return jsonError("Not found", 404);
  if (
    user.schoolId &&
    String(hw.schoolId) !== String(user.schoolId) &&
    user.role !== "super_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  hw.status = body.status;
  await hw.save();
  return jsonOk({ homework: homeworkToClient(hw) });
}
