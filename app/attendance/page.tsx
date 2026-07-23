"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/auth";
import { useSchoolData } from "@/lib/school-data";
import { useTeacherClass, type AttendMark } from "@/lib/teacher-class";
import {
  formatLeaveRange,
  useLeaves,
  type LeaveStatus,
} from "@/lib/leaves";

const MARKS: AttendMark[] = ["P", "A", "L", "H"];

export default function AttendancePage() {
  const { user } = useAuth();
  const { canPostAsTeacher } = useSchoolData();
  const {
    ready,
    roster,
    todayMarks,
    presentCount,
    markedCount,
    setMark,
    markAllPresent,
    todayKey,
  } = useTeacherClass();
  const {
    ready: leavesReady,
    pendingLeaves,
    reviewLeave,
    approvedLeaveDates,
    myLeaves,
    leaves,
  } = useLeaves();

  const teacher = canPostAsTeacher(user);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const monthLabel = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const leaveDays = useMemo(
    () => approvedLeaveDates(user ?? null),
    [approvedLeaveDates, user],
  );

  const statusMap = useMemo(() => {
    const map: Record<number, "P" | "A" | "L" | "H" | null> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(year, month, d).getDay();
      if (dow === 0) {
        map[d] = null; // Sunday off
        continue;
      }
      if (leaveDays.has(key)) {
        map[d] = "L";
        continue;
      }
      // Demo base pattern for non-leave weekdays
      if (d % 11 === 0) map[d] = "A";
      else if (d % 13 === 0) map[d] = "H";
      else map[d] = "P";
    }
    return map;
  }, [daysInMonth, year, month, leaveDays]);

  const leaveStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let half = 0;
    Object.values(statusMap).forEach((s) => {
      if (s === "P") present += 1;
      if (s === "A") absent += 1;
      if (s === "L") leave += 1;
      if (s === "H") half += 1;
    });
    const marked = present + absent + leave + half;
    const pct = marked ? Math.round((present / marked) * 100) : 0;
    return { present, absent, leave, half, pct };
  }, [statusMap]);

  const history = useMemo(() => {
    if (!user) return [];
    if (teacher) {
      return leaves.filter(
        (l) => !user.className || !l.className || l.className === user.className,
      );
    }
    const mine = myLeaves(user.id);
    if (mine.length) return mine;
    return leaves.filter(
      (l) =>
        l.applicantId === "seed-parent" ||
        (user.childName &&
          l.studentName.toLowerCase() === user.childName.toLowerCase()) ||
        l.studentName.toLowerCase() === user.name.toLowerCase(),
    );
  }, [user, teacher, leaves, myLeaves]);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  if (!ready || !leavesReady) {
    return (
      <PhoneShell subtitle="Loading" title="Attendance">
        <p className="muted text-sm">Loading…</p>
      </PhoneShell>
    );
  }

  const pct =
    markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

  return (
    <PhoneShell
      subtitle={
        teacher
          ? `Class ${user?.className || "6-B"} · ${todayKey}`
          : monthLabel
      }
      title="Attendance"
    >
      {teacher ? (
        <>
          <section className="card" style={{ padding: "1.25rem" }}>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <div>
                <p className="text-xs muted">Today’s class</p>
                <p
                  className="tone-success font-semibold"
                  style={{
                    fontSize: "2.25rem",
                    margin: "0.25rem 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {pct}%
                </p>
              </div>
              <div
                className="text-xs muted"
                style={{ marginLeft: "auto", textAlign: "right", lineHeight: 1.6 }}
              >
                <p style={{ margin: 0 }}>
                  {presentCount} Present · {markedCount}/{roster.length} marked
                </p>
                <button
                  type="button"
                  className="tone-primary font-semibold"
                  style={{ marginTop: 4 }}
                  onClick={() => markAllPresent()}
                >
                  Mark all Present
                </button>
              </div>
            </div>
            <div className="progress">
              <span style={{ width: `${pct}%` }} />
            </div>
          </section>

          {pendingLeaves.length > 0 && (
            <>
              <h2 className="section-label">Pending leave approvals</h2>
              <ul className="leave-list">
                {pendingLeaves.map((l) => (
                  <li key={l.id} className="card card-pad">
                    <p className="font-semibold text-sm" style={{ margin: 0 }}>
                      {l.studentName}
                    </p>
                    <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                      {formatLeaveRange(l.fromDate, l.toDate)} · {l.reason}
                    </p>
                    <div className="row mt-2" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: "auto", padding: "0.45rem 0.9rem" }}
                        onClick={() =>
                          user && reviewLeave(l.id, "approved", user)
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          user && reviewLeave(l.id, "rejected", user)
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <ul className="roster-list mt-4">
            {roster.map((s) => {
              const mark = todayMarks[s.id];
              const studentLeave = leaves.some(
                (l) =>
                  l.status === "approved" &&
                  l.studentName.toLowerCase() === s.name.toLowerCase() &&
                  l.fromDate <= todayKey &&
                  l.toDate >= todayKey,
              );
              return (
                <li key={s.id} className="roster-card">
                  <div className="row" style={{ gap: 10 }}>
                    <div className="roster-avatar">{s.avatar}</div>
                    <div className="grow">
                      <p className="font-semibold text-sm" style={{ margin: 0 }}>
                        {s.rollNo}. {s.name}
                      </p>
                      <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                        {studentLeave
                          ? "Approved leave today"
                          : "Tap P / A / L / H"}
                      </p>
                    </div>
                  </div>
                  <div className="mark-row mt-2">
                    {MARKS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`mark-btn mark-${m} ${
                          mark === m || (studentLeave && m === "L" && !mark)
                            ? "active"
                            : ""
                        }`}
                        onClick={() => setMark(s.id, m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          <Link href="/class" className="btn-primary mt-4">
            Open teacher class desk
          </Link>

          <h2 className="section-label">Leave history</h2>
          <LeaveHistoryList items={history} />
        </>
      ) : (
        <>
          <section className="card" style={{ padding: "1.25rem" }}>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <div>
                <p className="text-xs muted">This month</p>
                <p
                  className="tone-success font-semibold"
                  style={{
                    fontSize: "2.25rem",
                    margin: "0.25rem 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {leaveStats.pct}%
                </p>
              </div>
              <div
                className="text-xs muted"
                style={{ marginLeft: "auto", textAlign: "right", lineHeight: 1.6 }}
              >
                <p style={{ margin: 0 }}>{leaveStats.present} Present</p>
                <p style={{ margin: 0 }}>
                  {leaveStats.absent} Absent · {leaveStats.leave} Leave ·{" "}
                  {leaveStats.half} Half
                </p>
              </div>
            </div>
            <div className="progress">
              <span style={{ width: `${leaveStats.pct}%` }} />
            </div>
          </section>

          <section className="card card-pad mt-4">
            <p className="text-xs muted" style={{ margin: "0 0 0.5rem" }}>
              Approved leaves show as <strong>L</strong> on the calendar.
            </p>
            <div className="cal-grid text-10 font-semibold muted mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((d, i) => (
                <div key={i}>
                  {d && (
                    <div className={`cal-day cal-${statusMap[d] ?? "empty"}`}>
                      {d}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="legend">
              <Legend color="var(--success)" label="Present" />
              <Legend color="var(--destructive)" label="Absent" />
              <Legend color="var(--warning)" label="Leave" />
              <Legend color="var(--secondary)" label="Half" />
            </div>
          </section>

          <div className="row mt-3" style={{ gap: 8 }}>
            <Link href="/profile" className="btn-secondary grow">
              Apply leave in Profile
            </Link>
          </div>

          <h2 className="section-label">Leave history</h2>
          <LeaveHistoryList items={history} />
        </>
      )}
    </PhoneShell>
  );
}

function LeaveHistoryList({
  items,
}: {
  items: Array<{
    id: string;
    studentName: string;
    fromDate: string;
    toDate: string;
    reason: string;
    status: LeaveStatus;
    appliedAt: number;
    reviewedBy?: string;
  }>;
}) {
  if (!items.length) {
    return (
      <p className="text-sm muted card card-pad">No leave history yet.</p>
    );
  }
  return (
    <ul className="leave-list">
      {items.map((l) => (
        <li key={l.id} className="card card-pad">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              {l.studentName}
            </p>
            <span className={`leave-badge leave-${l.status}`}>{l.status}</span>
          </div>
          <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
            {formatLeaveRange(l.fromDate, l.toDate)}
          </p>
          <p className="text-xs" style={{ margin: "6px 0 0" }}>
            {l.reason}
          </p>
          <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
            {new Date(l.appliedAt).toLocaleDateString()}
            {l.reviewedBy ? ` · by ${l.reviewedBy}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
