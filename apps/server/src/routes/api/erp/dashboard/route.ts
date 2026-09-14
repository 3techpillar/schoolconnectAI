import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import { Leave, leaveToClient } from "@/lib/models/ops/Leave";
import { StudentProfile } from "@/lib/models/erp/StudentProfile";
import { StudentEnrollment } from "@/lib/models/core/StudentEnrollment";
import { StaffProfile } from "@/lib/models/erp/StaffProfile";
import { FeeInvoice } from "@/lib/models/erp/FeeInvoice";
import { ClassModel } from "@/lib/models/core/Class";
import { ParentStudentLink, linkToClient } from "@/lib/models/family/ParentStudentLink";
import { User } from "@/lib/models/core/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireErpUser, resolveErpSchoolId } from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const schoolId = scope.schoolId;
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const [
    students,
    classes,
    staff,
    pendingEnroll,
    pendingLeaves,
    openInvoices,
    desks,
    links,
    recentLeaves,
  ] = await Promise.all([
    StudentProfile.countDocuments({ schoolId, status: "enrolled" }),
    ClassModel.countDocuments({ schoolId }),
    StaffProfile.countDocuments({ schoolId, status: "active" }),
    StudentEnrollment.countDocuments({ schoolId, status: "pending" }),
    Leave.countDocuments({ schoolId, status: "pending" }),
    FeeInvoice.countDocuments({
      schoolId,
      status: { $in: ["issued", "partial"] },
    }),
    ClassDesk.find({ schoolId }).limit(50),
    ParentStudentLink.find({ schoolId, status: "active" }).limit(100),
    Leave.find({ schoolId }).sort({ appliedAt: -1 }).limit(20),
  ]);

  let presentToday = 0;
  let leaveToday = 0;
  let markedToday = 0;
  for (const desk of desks) {
    const day = (desk.attendanceByDay || {})[today] || {};
    for (const mark of Object.values(day)) {
      markedToday += 1;
      if (mark === "P") presentToday += 1;
      if (mark === "L") leaveToday += 1;
    }
  }

  const users = await User.find({ schoolId }).select("role").lean();
  const byRole: Record<string, number> = {};
  for (const u of users) {
    byRole[u.role] = (byRole[u.role] || 0) + 1;
  }

  return jsonOk({
    summary: {
      students,
      classes,
      staff,
      pendingEnrollments: pendingEnroll,
      pendingLeaves,
      openInvoices,
      presentToday,
      leaveToday,
      markedToday,
      month: monthPrefix,
    },
    usersByRole: byRole,
    recentLeaves: recentLeaves.map(leaveToClient),
    links: links.map(linkToClient),
  });
});
