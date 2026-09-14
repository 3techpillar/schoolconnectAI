import {
  AcademicSession,
  academicSessionToClient,
} from "@/lib/models/erp/AcademicSession";
import { School } from "@/lib/models/core/School";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const sessions = await AcademicSession.find({ schoolId: scope.schoolId })
    .sort({ label: -1 })
    .limit(50);
  return jsonOk({ sessions: sessions.map(academicSessionToClient) });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as {
    action?: "create" | "complete" | "activate";
    schoolId?: string;
    label?: string;
    startDate?: string;
    endDate?: string;
    sessionId?: string;
  };

  const scope = resolveErpSchoolId(user, body.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  if (body.action === "create") {
    const label = (body.label || "").trim();
    if (!label) return jsonError("label required");
    const session = await AcademicSession.create({
      schoolId: scope.schoolId,
      label,
      startDate: body.startDate || "",
      endDate: body.endDate || "",
      status: "upcoming",
    });
    await writeErpAudit({
      user,
      schoolId: scope.schoolId,
      action: "create",
      entityType: "AcademicSession",
      entityId: String(session._id),
    });
    return jsonOk({ session: academicSessionToClient(session) }, 201);
  }

  if (!body.sessionId || !mongoose.Types.ObjectId.isValid(body.sessionId)) {
    return jsonError("sessionId required");
  }
  const session = await AcademicSession.findById(body.sessionId);
  if (!session) return jsonError("Session not found", 404);
  if (String(session.schoolId) !== scope.schoolId) {
    return jsonError("Forbidden", 403);
  }

  if (body.action === "complete") {
    session.status = "completed";
    await session.save();
  } else if (body.action === "activate") {
    await AcademicSession.updateMany(
      { schoolId: scope.schoolId, status: "active" },
      { $set: { status: "completed" } },
    );
    session.status = "active";
    await session.save();
    await School.findByIdAndUpdate(scope.schoolId, {
      academicYearCurrent: session.label,
    });
  } else {
    return jsonError("Unknown action");
  }

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: body.action,
    entityType: "AcademicSession",
    entityId: String(session._id),
  });

  return jsonOk({ session: academicSessionToClient(session) });
});
