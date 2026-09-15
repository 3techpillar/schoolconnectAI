import {
  AdmissionApplication,
  admissionApplicationToClient,
} from "@/lib/models/erp/AdmissionApplication";
import {
  enrollmentToClient,
  StudentEnrollment,
} from "@/lib/models/core/StudentEnrollment";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { ensureProfilesForEnrollment } from "@/lib/server/services/student-sync";
import { erpAdmissionPatchSchema } from "@schoolconnect/shared";
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

  const applications = await AdmissionApplication.find(filter)
    .sort({ createdAt: -1 })
    .limit(300);

  const enrollments = await StudentEnrollment.find({
    schoolId: scope.schoolId,
  })
    .sort({ createdAt: -1 })
    .limit(300);

  return jsonOk({
    applications: applications.map(admissionApplicationToClient),
    enrollments: enrollments.map(enrollmentToClient),
  });
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("id is required");
  }

  const app = await AdmissionApplication.findById(id);
  if (!app) return jsonError("Application not found", 404);

  const scope = resolveErpSchoolId(user, String(app.schoolId));
  if (scope.error) return scope.error;

  const parsed = erpAdmissionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const data = parsed.data;
  if (data.status) app.status = data.status;
  if (data.note !== undefined) app.note = data.note;
  if (data.interviewAt !== undefined) app.interviewAt = data.interviewAt;
  if (data.interviewNotes !== undefined) app.interviewNotes = data.interviewNotes;
  if (data.admissionFeePaise !== undefined) {
    app.admissionFeePaise = data.admissionFeePaise;
  }
  if (data.admissionFeePaid !== undefined) {
    app.admissionFeePaid = data.admissionFeePaid;
  }
  if (data.documents) app.documents = data.documents as typeof app.documents;
  app.reviewedByName = user.name;
  app.reviewedAt = new Date();
  await app.save();

  if (
    (data.status === "enrolled" || data.status === "approved") &&
    app.enrollmentId
  ) {
    const enrollment = await StudentEnrollment.findById(app.enrollmentId);
    if (enrollment && enrollment.status !== "approved") {
      enrollment.status = "approved";
      enrollment.reviewedAt = new Date();
      enrollment.reviewedByName = user.name;
      await enrollment.save();
      const profile = await ensureProfilesForEnrollment({
        schoolId: enrollment.schoolId,
        studentName: enrollment.studentName,
        className: enrollment.className,
        classId: enrollment.classId,
        studentUserId: enrollment.studentUserId,
      });
      app.studentProfileId = profile._id;
      await app.save();
    }
  }

  await writeErpAudit({
    user,
    schoolId: app.schoolId,
    action: "update",
    entityType: "AdmissionApplication",
    entityId: String(app._id),
    meta: { status: app.status },
  });

  return jsonOk({ application: admissionApplicationToClient(app) });
});
