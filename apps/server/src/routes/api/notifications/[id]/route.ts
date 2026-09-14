import {
  Notification,
  notificationToClient,
} from "@/lib/models/comms/Notification";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid notification id");
  }

  const n = await Notification.findById(id);
  if (!n) return jsonError("Not found", 404);
  if (
    user.schoolId &&
    String(n.schoolId) !== String(user.schoolId) &&
    user.role !== "super_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  const uid = String(user._id);
  if (!(n.readBy || []).includes(uid)) {
    n.readBy = [...(n.readBy || []), uid];
    await n.save();
  }

  return jsonOk({ notification: notificationToClient(n, uid) });
}
