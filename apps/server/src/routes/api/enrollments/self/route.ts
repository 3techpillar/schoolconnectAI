import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  enrollmentClient,
  ensureStudentEnrollmentForUser,
} from "@/lib/server/services/enrollment-service";
import { requireUser } from "@/lib/server/http";

/** Student self-ensure: create/link pending enrollment row if missing. */
export async function POST() {
  const { error, user } = await requireUser(["student"]);
  if (error || !user) return error!;

  try {
    const { enrollment, created } = await ensureStudentEnrollmentForUser(user);
    if (!enrollment) {
      return jsonError("Could not ensure enrollment", 500);
    }
    return jsonOk({
      enrollment: enrollmentClient(enrollment),
      created,
      userEnrollmentStatus: user.enrollmentStatus,
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Enrollment ensure failed",
      400,
    );
  }
}
