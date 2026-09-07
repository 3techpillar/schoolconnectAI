import { Leave, leaveToClient } from "@/lib/models/ops/Leave";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  applyApprovedLeaveToAttendance,
  clearLeaveAttendanceMarks,
} from "@/lib/server/services/leave-attendance";
import { requireErpUser, resolveErpSchoolId, writeErpAudit } from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const status = url.searchParams.get("status");
  const filter: Record<string, unknown> = { schoolId: scope.schoolId };
  if (status) filter.status = status;

  const leaves = await Leave.find(filter).sort({ appliedAt: -1 }).limit(200);
  return jsonOk({ leaves: leaves.map(leaveToClient) });
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as {
    id?: string;
    status?: "approved" | "rejected";
    note?: string;
  };
  if (!body.id || !mongoose.Types.ObjectId.isValid(body.id)) {
    return jsonError("id required");
  }
  if (!body.status) return jsonError("status required");

  const leave = await Leave.findById(body.id);
  if (!leave) return jsonError("Not found", 404);

  const scope = resolveErpSchoolId(user, String(leave.schoolId));
  if (scope.error) return scope.error;

  leave.status = body.status;
  leave.reviewedBy = user.name;
  leave.reviewedAt = Date.now();
  if (body.note?.trim()) leave.note = body.note.trim();
  await leave.save();

  let attendanceSync = null;
  if (body.status === "approved") {
    attendanceSync = await applyApprovedLeaveToAttendance(leave);
  } else {
    attendanceSync = await clearLeaveAttendanceMarks(leave);
  }

  await writeErpAudit({
    user,
    schoolId: leave.schoolId,
    action: body.status,
    entityType: "Leave",
    entityId: String(leave._id),
  });

  return jsonOk({ leave: leaveToClient(leave), attendanceSync });
});
