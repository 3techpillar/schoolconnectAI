import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import type { LeaveDoc } from "@/lib/models/ops/Leave";
import { Leave } from "@/lib/models/ops/Leave";
import type { Types } from "mongoose";

export type AttendMark = "P" | "A" | "L" | "H" | "T";

type RosterRow = {
  key: string;
  name: string;
  userId?: string | null;
  studentProfileId?: string | null;
};

/** Inclusive ISO date range YYYY-MM-DD — weekdays only (Mon–Fri). */
export function leaveDateKeys(fromDate: string, toDate: string): string[] {
  const out: string[] = [];
  const a = new Date(fromDate + "T12:00:00");
  const b = new Date(toDate + "T12:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return out;
  const start = a <= b ? a : b;
  const end = a <= b ? b : a;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      out.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function findRosterStudent(
  roster: RosterRow[],
  leave: Pick<LeaveDoc, "studentName" | "studentProfileId"> & {
    userId?: string;
  },
) {
  if (leave.studentProfileId) {
    const id = String(leave.studentProfileId);
    const byProfile = roster.find((s) => s.studentProfileId === id);
    if (byProfile) return byProfile;
  }
  if (leave.userId) {
    const byUser = roster.find((s) => s.userId === leave.userId);
    if (byUser) return byUser;
  }
  const target = leave.studentName.trim().toLowerCase();
  return roster.find((s) => s.name.trim().toLowerCase() === target) || null;
}

/**
 * Persist approved leave as attendance mark `L` on ClassDesk for each weekday.
 * Prefers studentProfileId / userId, falls back to name.
 */
export async function applyApprovedLeaveToAttendance(leave: LeaveDoc): Promise<{
  studentKey: string | null;
  dates: string[];
  className: string;
}> {
  const className = leave.className || "6-B";
  const dates = leaveDateKeys(leave.fromDate, leave.toDate);
  if (!dates.length || !leave.schoolId) {
    return { studentKey: null, dates: [], className };
  }

  let desk = await ClassDesk.findOne({
    schoolId: leave.schoolId,
    className,
  });
  if (!desk) {
    desk = await ClassDesk.create({
      schoolId: leave.schoolId,
      className,
      roster: [],
      attendanceByDay: {},
      circulars: [],
    });
  }

  const student = findRosterStudent(desk.roster || [], leave);
  if (!student) {
    return { studentKey: null, dates, className };
  }

  const byDay = {
    ...((desk.attendanceByDay || {}) as Record<string, Record<string, string>>),
  };
  for (const dateKey of dates) {
    byDay[dateKey] = {
      ...(byDay[dateKey] || {}),
      [student.key]: "L",
    };
  }
  desk.attendanceByDay = byDay;
  desk.markModified("attendanceByDay");
  await desk.save();

  return { studentKey: student.key, dates, className };
}

/** Clear auto-applied L marks when leave is rejected / withdrawn. */
export async function clearLeaveAttendanceMarks(leave: LeaveDoc): Promise<{
  studentKey: string | null;
  dates: string[];
  className: string;
}> {
  const className = leave.className || "6-B";
  const dates = leaveDateKeys(leave.fromDate, leave.toDate);
  if (!dates.length || !leave.schoolId) {
    return { studentKey: null, dates: [], className };
  }

  const desk = await ClassDesk.findOne({
    schoolId: leave.schoolId,
    className,
  });
  if (!desk) return { studentKey: null, dates, className };

  const student = findRosterStudent(desk.roster || [], leave);
  if (!student) return { studentKey: null, dates, className };

  const byDay = {
    ...((desk.attendanceByDay || {}) as Record<string, Record<string, string>>),
  };
  for (const dateKey of dates) {
    const day = { ...(byDay[dateKey] || {}) };
    if (day[student.key] === "L") {
      delete day[student.key];
      byDay[dateKey] = day;
    }
  }
  desk.attendanceByDay = byDay;
  desk.markModified("attendanceByDay");
  await desk.save();

  return { studentKey: student.key, dates, className };
}

/** Roster keys on approved leave for a given class + date. */
export async function studentKeysOnLeaveForDate(input: {
  schoolId: Types.ObjectId | string;
  className: string;
  dateKey: string;
  roster: RosterRow[];
}): Promise<Set<string>> {
  const keys = new Set<string>();
  const leaves = await Leave.find({
    schoolId: input.schoolId,
    status: "approved",
    fromDate: { $lte: input.dateKey },
    toDate: { $gte: input.dateKey },
    $or: [
      { className: input.className },
      { className: { $exists: false } },
      { className: null },
      { className: "" },
    ],
  }).limit(200);

  for (const leave of leaves) {
    if (leave.className && leave.className !== input.className) continue;
    const student = findRosterStudent(input.roster, leave);
    if (student) keys.add(student.key);
  }
  return keys;
}

/**
 * Merge bulk attendance marks without clearing approved-leave `L`s.
 */
export async function mergeAttendancePreservingLeave(input: {
  schoolId: Types.ObjectId | string;
  className: string;
  dateKey: string;
  roster: RosterRow[];
  marks: Record<string, string>;
  existing?: Record<string, string>;
}): Promise<Record<string, AttendMark>> {
  const onLeave = await studentKeysOnLeaveForDate({
    schoolId: input.schoolId,
    className: input.className,
    dateKey: input.dateKey,
    roster: input.roster,
  });
  const next: Record<string, AttendMark> = {};
  for (const [id, mark] of Object.entries(input.marks)) {
    if (onLeave.has(id)) {
      next[id] = "L";
    } else {
      next[id] = (mark as AttendMark) || "P";
    }
  }
  for (const id of onLeave) {
    next[id] = "L";
  }
  return next;
}
