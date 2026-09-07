import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import type { User } from "@/lib/models/core/User";
import { getPrimaryLinkedStudent } from "@/lib/server/services/link-service";
import { ensureSchoolDemoData } from "@/lib/server/services/seed-school";

type UserInstance = InstanceType<typeof User>;
type Mark = "P" | "A" | "L" | "H" | "T";

function monthPrefix(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function resolveStudentKey(
  desk: InstanceType<typeof ClassDesk>,
  user: UserInstance,
) {
  const roster = desk.roster || [];

  if (user.role === "parent") {
    const linked = await getPrimaryLinkedStudent(user);
    if (linked) {
      const byUser = roster.find(
        (s) => s.userId && s.userId === String(linked._id),
      );
      if (byUser) return byUser.key;
      const byName = roster.find(
        (s) =>
          s.name.trim().toLowerCase() === linked.name.trim().toLowerCase(),
      );
      if (byName) return byName.key;
    }
  }

  const byUser = roster.find((s) => s.userId && s.userId === String(user._id));
  if (byUser) return byUser.key;
  const byName = roster.find(
    (s) => s.name.trim().toLowerCase() === user.name.trim().toLowerCase(),
  );
  if (byName) return byName.key;
  if (user.role === "parent" && user.childName) {
    const child = roster.find(
      (s) =>
        s.name.trim().toLowerCase() === user.childName!.trim().toLowerCase(),
    );
    if (child) return child.key;
  }
  return roster[0]?.key || null;
}

/**
 * Present rate for the current calendar month from ClassDesk marks.
 * Counts P and L as present-ish for %; H optional half.
 */
export async function getAttendanceSummary(user: UserInstance) {
  if (!user.schoolId) {
    return {
      percent: null as number | null,
      present: 0,
      total: 0,
      label: "—",
      hint: "No school",
      month: monthPrefix(),
    };
  }

  await ensureSchoolDemoData(user.schoolId);
  const className = user.className || "6-B";
  const desk = await ClassDesk.findOne({
    schoolId: user.schoolId,
    className,
  });

  if (!desk) {
    return {
      percent: null as number | null,
      present: 0,
      total: 0,
      label: "—",
      hint: "No class data",
      month: monthPrefix(),
    };
  }

    const studentKey = await resolveStudentKey(desk, user);
  const prefix = monthPrefix();
  const byDay = (desk.attendanceByDay || {}) as Record<
    string,
    Record<string, Mark>
  >;

  let present = 0;
  let total = 0;

  if (studentKey) {
    for (const [day, marks] of Object.entries(byDay)) {
      if (!day.startsWith(prefix)) continue;
      const mark = marks?.[studentKey];
      if (!mark) continue;
      total += 1;
      if (mark === "P" || mark === "L" || mark === "H") present += 1;
    }
  } else if (user.role === "class_teacher" || user.role === "admin") {
    // Class average across roster for the month
    const rosterKeys = (desk.roster || []).map((s) => s.key);
    for (const [day, marks] of Object.entries(byDay)) {
      if (!day.startsWith(prefix)) continue;
      for (const key of rosterKeys) {
        const mark = marks?.[key];
        if (!mark) continue;
        total += 1;
        if (mark === "P" || mark === "L" || mark === "H") present += 1;
      }
    }
  }

  if (total === 0) {
    return {
      percent: null as number | null,
      present: 0,
      total: 0,
      label: "—",
      hint: "No marks yet",
      month: prefix,
    };
  }

  const percent = Math.round((present / total) * 100);
  return {
    percent,
    present,
    total,
    label: `${percent}%`,
    hint: "This month",
    month: prefix,
  };
}
