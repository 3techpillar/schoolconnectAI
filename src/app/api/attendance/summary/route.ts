import { getAttendanceSummary } from "@/lib/server/attendance-service";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const summary = await getAttendanceSummary(user);
  return jsonOk({ attendance: summary });
}

export const GET = withApiHandler(getHandler);
