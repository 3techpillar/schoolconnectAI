import { Notification } from "@/lib/models/Notification";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";

export async function POST() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const uid = String(user._id);
  await Notification.updateMany(
    { schoolId: user.schoolId, readBy: { $ne: uid } },
    { $addToSet: { readBy: uid } },
  );

  return jsonOk({ marked: true });
}
