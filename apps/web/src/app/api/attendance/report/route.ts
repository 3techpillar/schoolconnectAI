import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import { Leave, leaveToClient } from "@/lib/models/ops/Leave";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";

function monthPrefix(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function getHandler() {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "principal",
    "class_teacher",
  ]);
  if (error || !user) return error!;
  if (!user.schoolId) {
    return jsonOk({
      month: monthPrefix(),
      summary: {
        pending: 0,
        approvedMonth: 0,
        rejectedMonth: 0,
        leaveMarksMonth: 0,
      },
      leaves: [],
      classes: [],
    });
  }

  const month = monthPrefix();
  const today = new Date().toISOString().slice(0, 10);

  const leaves = await Leave.find({ schoolId: user.schoolId })
    .sort({ appliedAt: -1 })
    .limit(200);

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approvedMonth = leaves.filter(
    (l) =>
      l.status === "approved" &&
      (l.fromDate.startsWith(month) || l.toDate.startsWith(month)),
  ).length;
  const rejectedMonth = leaves.filter(
    (l) =>
      l.status === "rejected" &&
      (l.reviewedAt
        ? new Date(l.reviewedAt).toISOString().slice(0, 7) === month
        : false),
  ).length;

  const desks = await ClassDesk.find({ schoolId: user.schoolId }).limit(50);
  const classes = desks.map((desk) => {
    const byDay =
      (desk.attendanceByDay as Record<string, Record<string, string>>) || {};
    let leaveMarksMonth = 0;
    let presentToday = 0;
    let leaveToday = 0;
    let markedToday = 0;
    for (const [dateKey, marks] of Object.entries(byDay)) {
      if (dateKey.startsWith(month)) {
        leaveMarksMonth += Object.values(marks).filter((m) => m === "L").length;
      }
      if (dateKey === today) {
        const vals = Object.values(marks);
        markedToday = vals.length;
        presentToday = vals.filter((m) => m === "P").length;
        leaveToday = vals.filter((m) => m === "L").length;
      }
    }
    return {
      className: desk.className,
      rosterCount: (desk.roster || []).length,
      leaveMarksMonth,
      presentToday,
      leaveToday,
      markedToday,
    };
  });

  const leaveMarksMonth = classes.reduce((n, c) => n + c.leaveMarksMonth, 0);

  return jsonOk({
    month,
    summary: {
      pending,
      approvedMonth,
      rejectedMonth,
      leaveMarksMonth,
    },
    leaves: leaves.slice(0, 40).map(leaveToClient),
    classes,
  });
}

export const GET = withApiHandler(getHandler);
