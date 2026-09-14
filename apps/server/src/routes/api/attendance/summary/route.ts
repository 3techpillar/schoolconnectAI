import { getAttendanceSummary } from "@/lib/server/services/attendance-service";
import { jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) {
    return jsonOk({ attendance: { label: "—", hint: "School not linked" } });
  }

  const summary = await getAttendanceSummary(user);
  return jsonOk({ attendance: summary });
}

export const GET = withApiHandler(getHandler);
