"use client";

import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import {
  useTeacherClass,
  type AttendMark,
} from "@/lib/providers/teacher-class";
import { useStaffAttendance } from "@/lib/providers/staff-attendance";
import {
  formatLeaveRange,
  useLeaves,
  type LeaveCategory,
  type LeaveStatus,
} from "@/lib/providers/leaves";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { CalendarCheck, ShieldCheck } from "@/components/shell/Icons";
import { toIsoDate } from "@/lib/shared/dates";

const MARKS: AttendMark[] = ["P", "A", "L", "H", "T", "E", "HOL"];

const MARK_LABELS: Record<AttendMark, { label: string; bg: string; color: string; dot: string }> = {
  P: { label: "Present", bg: "var(--success-subtle, #ecfdf5)", color: "#047857", dot: "🟢" },
  A: { label: "Absent", bg: "var(--danger-subtle, #fef2f2)", color: "#b91c1c", dot: "🔴" },
  L: { label: "Approved Leave", bg: "var(--info-subtle, #eff6ff)", color: "#1d4ed8", dot: "🔵" },
  H: { label: "Half-Day", bg: "#fff7ed", color: "#c2410c", dot: "🟧" },
  T: { label: "Late", bg: "#fefce8", color: "#a16207", dot: "🟡" },
  E: { label: "Excused", bg: "#faf5ff", color: "#7e22ce", dot: "🟣" },
  HOL: { label: "Holiday", bg: "#f3f4f6", color: "#4b5563", dot: "⚪" },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { canPostAsTeacher } = useSchoolData();
  const [activeWardId, setActiveWardId] = useState("ward-aarav");
  const wards = useMemo(
    () => [
      { id: "ward-aarav", name: user?.childName || "Aarav Sharma", className: "6-B" },
      { id: "ward-ananya", name: "Ananya Sharma", className: "3-A" },
    ],
    [user],
  );
  const activeWard = useMemo(
    () => wards.find((w) => w.id === activeWardId) || wards[0],
    [wards, activeWardId],
  );
  const {
    ready,
    roster,
    presentCount,
    markedCount,
    setMark,
    markAllPresent,
    todayKey,
    attendanceByDay,
    isDateLocked,
    unlockRosterDate,
    auditLogs,
  } = useTeacherClass();
  const {
    ready: leavesReady,
    pendingStudentLeaves,
    pendingTeacherLeaves,
    reviewLeave,
    approvedLeaveDates,
    myLeaves,
    leaves,
    applyLeave,
  } = useLeaves();
  const {
    ready: staffReady,
    getStaffMonthStatusMap,
    getStaffMonthStats,
  } = useStaffAttendance();

  const [activeTab, setActiveTab] = useState<"class" | "personal" | "staff_leaves" | "audit_logs">("class");
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate());
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [fromDate, setFromDate] = useState(toIsoDate());
  const [toDate, setToDate] = useState(toIsoDate());
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<LeaveCategory>("casual");
  const [studentName, setStudentName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  // Unlock Historic Attendance Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");

  useEffect(() => {
    if (user?.childName) {
      setStudentName(user.childName);
    }
  }, [user]);

  const teacher = canPostAsTeacher(user);
  const isAdminOrPrincipal = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "principal" ||
        user.role === "vice_principal" ||
        user.role === "super_admin"),
  );
  const isStaff = Boolean(user && user.role !== "student" && user.role !== "parent");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const monthLabel = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const selectedMarks = useMemo(() => {
    return attendanceByDay[selectedDate] || {};
  }, [attendanceByDay, selectedDate]);

  const locked = isDateLocked(selectedDate);

  const onApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !fromDate || !toDate || !user) return;
    const who =
      user.role === "parent"
        ? (activeWard?.name || studentName.trim() || user.childName || "Student")
        : user.name;
    applyLeave({
      user,
      studentName: who,
      fromDate,
      toDate: toDate < fromDate ? fromDate : toDate,
      reason,
      category,
    });
    setReason("");
    setFlash(
      user.role === "parent"
        ? `Leave request submitted for ${who} — awaiting teacher review.`
        : "Staff leave request submitted — awaiting administration review.",
    );
  };

  const onUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim() || !user) return;
    const ok = unlockRosterDate(selectedDate, unlockReason, user);
    if (ok) {
      setFlash(`Unlocked attendance roster for ${selectedDate}.`);
      setShowUnlockModal(false);
      setUnlockReason("");
    }
  };

  const leaveDays = useMemo(
    () => approvedLeaveDates(user ?? null),
    [approvedLeaveDates, user],
  );

  // Student/Parent Status Map
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

  // Staff Personal Status Map & Stats
  const staffStatusMap = useMemo(() => {
    if (!user) return {};
    return getStaffMonthStatusMap(user.id, year, month);
  }, [user, year, month, getStaffMonthStatusMap]);

  const staffStats = useMemo(() => {
    if (!user) return { present: 0, absent: 0, leave: 0, half: 0, pct: 0 };
    return getStaffMonthStats(user.id, year, month);
  }, [user, year, month, getStaffMonthStats]);

  const history = useMemo(() => {
    if (!user) return [];
    if (isStaff) {
      return leaves.filter(
        (l) =>
          l.applicantId === user.id ||
          (user.name && l.applicantName.toLowerCase() === user.name.toLowerCase()),
      );
    }
    const mine = myLeaves(user.id);
    if (mine.length) return mine;
    if (user.role === "parent") {
      const isDemoAarav = user.childName?.toLowerCase() === "aarav sharma";
      return leaves.filter(
        (l) =>
          l.applicantId === user.id ||
          (isDemoAarav && l.applicantId === "seed-parent") ||
          (user.childName &&
            l.studentName.toLowerCase() === user.childName.toLowerCase()),
      );
    }
    const isDemoAaravStudent = user.name?.toLowerCase() === "aarav sharma";
    return leaves.filter(
      (l) =>
        l.applicantId === user.id ||
        (isDemoAaravStudent && l.applicantId === "seed-parent") ||
        (user.name && l.studentName.toLowerCase() === user.name.toLowerCase()),
    );
  }, [user, isStaff, leaves, myLeaves]);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  if (!ready || !leavesReady || !staffReady) {
    return (
      <PhoneShell subtitle="Calendar & leaves" title="Attendance">
        <LoadingBlock label="Loading attendance…" />
      </PhoneShell>
    );
  }

  const pct =
    markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

  return (
    <PhoneShell
      subtitle={
        teacher && activeTab === "class"
          ? `Class ${user?.className || "6-B"} · ${todayKey}`
          : monthLabel
      }
      title="Attendance"
      headerAccent="plain"
    >
      <section className="list-hero list-hero-blue">
        <p className="list-hero-kicker">
          {teacher ? "Staff & Class Desk" : "Trust view"}
        </p>
        <h2 className="list-hero-title">
          {teacher
            ? activeTab === "class"
              ? "Mark today’s attendance"
              : "My Staff Attendance"
            : isStaff
            ? "Staff Attendance & Leaves"
            : "Attendance & leaves"}
        </h2>
        <p className="list-hero-body">
          {teacher
            ? activeTab === "class"
              ? "Roster marks, leave approvals, and class presence in one desk."
              : "Track your personal presence, leaves, and monthly attendance stats."
            : isStaff
            ? "Track your personal presence, leaves, and monthly staff attendance stats."
            : "See present days, leaves, and month summary at a glance."}
        </p>
      </section>

      {/* Multi-Ward Switcher for Parent Role */}
      {user?.role === "parent" && wards.length > 0 && (
        <div className="card card-pad mt-2 mb-3 row" style={{ gap: 10, alignItems: "center" }}>
          <span className="text-xs font-semibold muted">Student Ward:</span>
          <div className="row grow" style={{ gap: 6 }}>
            {wards.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`btn-secondary text-xs ${activeWard?.id === w.id ? "btn-primary" : ""}`}
                style={{ padding: "0.35rem 0.75rem", borderRadius: "999px" }}
                onClick={() => setActiveWardId(w.id)}
              >
                {w.name} ({w.className})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab switch for Teachers, Admins & Principals */}
      {(teacher || isStaff) && (
        <div className="admin-tabs mt-3 mb-2" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
          {teacher && (
            <button
              type="button"
              className={`admin-tab ${activeTab === "class" ? "active" : ""}`}
              onClick={() => setActiveTab("class")}
            >
              Class Roll Call
            </button>
          )}
          <button
            type="button"
            className={`admin-tab ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            My Staff Heatmap
          </button>
          {isAdminOrPrincipal && (
            <>
              <button
                type="button"
                className={`admin-tab ${activeTab === "staff_leaves" ? "active" : ""}`}
                onClick={() => setActiveTab("staff_leaves")}
              >
                Staff Leaves Desk {pendingTeacherLeaves.length > 0 ? `(${pendingTeacherLeaves.length})` : ""}
              </button>
              <button
                type="button"
                className={`admin-tab ${activeTab === "audit_logs" ? "active" : ""}`}
                onClick={() => setActiveTab("audit_logs")}
              >
                Audit Logs
              </button>
            </>
          )}
        </div>
      )}

      {/* Teacher Class Roster Desk View */}
      {teacher && activeTab === "class" ? (
        <>
          <section className="card" style={{ padding: "1.25rem" }}>
            <div className="row" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <span className="text-xs font-semibold muted">Select Roll Call Date:</span>
                <input
                  type="date"
                  className="input text-xs font-semibold mt-1"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: "auto" }}
                />
              </div>
              {locked ? (
                <span className="leave-badge leave-rejected row" style={{ gap: 4 }}>
                  🔒 Locked Date
                </span>
              ) : (
                <span className="leave-badge leave-approved row" style={{ gap: 4 }}>
                  🟢 Open for Roll Call
                </span>
              )}
            </div>

            {locked && (
              <div
                className="card card-pad mt-2 mb-3"
                style={{ background: "var(--danger-subtle, #fef2f2)", borderColor: "#fecaca" }}
              >
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p className="font-semibold text-xs tone-danger" style={{ margin: 0 }}>
                      Midnight Auto-Lock Active for {selectedDate}
                    </p>
                    <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                      Modifications to historic attendance require Principal/Admin unlock reason.
                    </p>
                  </div>
                  {isAdminOrPrincipal && (
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      style={{ padding: "0.35rem 0.75rem", width: "auto" }}
                      onClick={() => setShowUnlockModal(true)}
                    >
                      Unlock Roster
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="row" style={{ alignItems: "flex-end", marginTop: 8 }}>
              <div>
                <p className="text-xs muted">Class Attendance ({selectedDate})</p>
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
                {!locked && (
                  <button
                    type="button"
                    className="tone-primary font-semibold"
                    style={{ marginTop: 4 }}
                    onClick={() => markAllPresent(selectedDate, user ?? undefined)}
                  >
                    1-Click Mark All Present
                  </button>
                )}
              </div>
            </div>
            <div className="progress mt-2">
              <span style={{ width: `${pct}%` }} />
            </div>
          </section>

          {pendingStudentLeaves.length > 0 && (
            <>
              <h2 className="section-label mt-4">Pending student leave approvals (Class Teacher Desk)</h2>
              <ul className="leave-list">
                {pendingStudentLeaves.map((l) => (
                  <li key={l.id} className="card card-pad">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <p className="font-semibold text-sm" style={{ margin: 0 }}>
                        {l.studentName}
                      </p>
                      <span className="leave-badge leave-pending" style={{ textTransform: "capitalize" }}>
                        {l.category || "casual"} leave
                      </span>
                    </div>
                    <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                      {formatLeaveRange(l.fromDate, l.toDate)} · {l.reason}
                    </p>
                    <div className="row mt-2" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: "auto", padding: "0.45rem 0.9rem" }}
                        onClick={() => user && reviewLeave(l.id, "approved", user)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => user && reviewLeave(l.id, "rejected", user)}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="section-label mt-4">Student Roster Roll Call ({roster.length} Students)</h2>
          <ul className="roster-list">
            {roster.map((s) => {
              const mark = selectedMarks[s.id];
              const studentLeave = leaves.some(
                (l) =>
                  l.status === "approved" &&
                  l.studentName.toLowerCase() === s.name.toLowerCase() &&
                  l.fromDate <= selectedDate &&
                  l.toDate >= selectedDate,
              );
              return (
                <li key={s.id} className="roster-card">
                  <div className="row" style={{ gap: 10, alignItems: "center" }}>
                    <div className="roster-avatar">{s.avatar}</div>
                    <div className="grow">
                      <p className="font-semibold text-sm" style={{ margin: 0 }}>
                        {s.rollNo}. {s.name}
                      </p>
                      <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                        {studentLeave ? "Approved Leave on file" : mark ? `Marked: ${MARK_LABELS[mark]?.label}` : "Not marked"}
                      </p>
                    </div>
                    {mark && (
                      <span
                        className="text-xs font-bold"
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: MARK_LABELS[mark].bg,
                          color: MARK_LABELS[mark].color,
                        }}
                      >
                        {MARK_LABELS[mark].dot} {mark}
                      </span>
                    )}
                  </div>
                  <div className="mark-row mt-2" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {MARKS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={locked && !isAdminOrPrincipal}
                        className={`mark-btn mark-${m} ${
                          mark === m || (studentLeave && m === "L" && !mark) ? "active" : ""
                        }`}
                        style={{ flex: 1, minWidth: 32, opacity: locked && !isAdminOrPrincipal ? 0.5 : 1 }}
                        onClick={() => user && setMark(s.id, m, selectedDate, user, locked ? "Historic Override" : undefined)}
                        title={MARK_LABELS[m].label}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : activeTab === "staff_leaves" && isAdminOrPrincipal ? (
        /* Admin & Principal Staff Leave Desk */
        <>
          <h2 className="section-label">Pending Staff Leave Applications ({pendingTeacherLeaves.length})</h2>
          {pendingTeacherLeaves.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              tone="teal"
              title="No pending staff leave applications"
              body="Staff members apply for leave here. Approve or reject with 1-click."
            />
          ) : (
            <ul className="leave-list mt-2">
              {pendingTeacherLeaves.map((l) => (
                <li key={l.id} className="card card-pad">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ margin: 0 }}>
                        {l.applicantName} ({l.applicantRole.replace("_", " ")})
                      </p>
                      <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                        {formatLeaveRange(l.fromDate, l.toDate)} · Category: <strong className="text-capitalize">{l.category || "casual"}</strong>
                      </p>
                    </div>
                    <span className="leave-badge leave-pending">Pending Admin</span>
                  </div>
                  <p className="text-xs mt-2" style={{ margin: "6px 0 0", fontStyle: "italic" }}>
                    &ldquo;{l.reason}&rdquo;
                  </p>
                  <div className="row mt-3" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: "auto", padding: "0.45rem 1rem" }}
                      onClick={() => user && reviewLeave(l.id, "approved", user)}
                    >
                      Approve Staff Leave
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => user && reviewLeave(l.id, "rejected", user)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : activeTab === "audit_logs" && isAdminOrPrincipal ? (
        /* Attendance Audit Log Inspector */
        <>
          <h2 className="section-label">Immutable Attendance Audit Logs ({auditLogs.length})</h2>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              tone="teal"
              title="No historic audit overrides logged yet"
              body="Unlocking locked historic attendance records will generate immutable log entries."
            />
          ) : (
            <ul className="leave-list mt-2">
              {auditLogs.map((log) => (
                <li key={log.id} className="card card-pad">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="text-xs font-semibold tone-primary">
                      Date: {log.dateKey}
                    </span>
                    <span className="text-11 muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-1" style={{ margin: "4px 0 0" }}>
                    Unlocked / Edited by: {log.unlockedBy} ({log.unlockedRole})
                  </p>
                  {log.studentName && (
                    <p className="text-xs muted" style={{ margin: "2px 0 0" }}>
                      Student: <strong>{log.studentName}</strong> | {log.oldMark || "None"} $\rightarrow$ <strong>{log.newMark}</strong>
                    </p>
                  )}
                  <p className="text-xs tone-secondary mt-1" style={{ margin: "4px 0 0" }}>
                    Reason: &ldquo;{log.reason}&rdquo;
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : isStaff ? (
        /* Staff Personal Attendance Calendar View (Teachers' own, Bus Attendant, Accountant, Admin, Principal) */
        <>
          <div className="summary-card mt-2">
            <div className="ring" style={{ ["--p" as string]: `${staffStats.pct}%` }}>
              <div className="ring-inner">{staffStats.pct}%</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                {staffStats.pct >= 85 ? "Healthy staff attendance" : "Needs attention"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.88 }}>
                {staffStats.present} present · {staffStats.absent} absent · {staffStats.leave} leave this month
              </div>
            </div>
          </div>

          <div className="month-nav">
            <div className="arrow-btn">‹</div>
            <div className="m-title">{monthLabel}</div>
            <div className="arrow-btn">›</div>
          </div>

          <div className="cal-grid">
            <div className="cal-dow">S</div>
            <div className="cal-dow">M</div>
            <div className="cal-dow">T</div>
            <div className="cal-dow">W</div>
            <div className="cal-dow">T</div>
            <div className="cal-dow">F</div>
            <div className="cal-dow">S</div>
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="cal-day blank" />;
              const st = staffStatusMap[d];
              const cls = st === "P" ? "p" : st === "A" ? "a" : st === "L" ? "l" : st === "H" ? "h" : "blank";
              return (
                <div key={i} className={`cal-day ${cls}`}>
                  {d}
                </div>
              );
            })}
          </div>

          <div className="legend mb-3">
            <Legend color="var(--success)" label="Present" />
            <Legend color="var(--danger)" label="Absent" />
            <Legend color="var(--info)" label="Leave" />
            <Legend color="var(--warning)" label="Half" />
          </div>

          <div className="hw-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
            <div>
              <div className="font-bold text-sm" style={{ marginBottom: 2 }}>Need a day off?</div>
              <div className="text-11 muted">Submit staff leave application to administration</div>
            </div>
            <button
              type="button"
              onClick={() => setShowApplyForm((prev) => !prev)}
              className="icon-btn"
              style={{
                background: "var(--primary)",
                color: "#ffffff",
                boxShadow: "var(--shadow-pop)",
                border: "none",
                cursor: "pointer",
                width: 36,
                height: 36,
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "999px",
                transition: "transform 0.2s ease",
                transform: showApplyForm ? "rotate(45deg)" : "none",
              }}
              title={showApplyForm ? "Close leave form" : "Apply for leave"}
            >
              +
            </button>
          </div>

          {showApplyForm && (
            <form className="card card-pad mt-3 space-y" onSubmit={onApply}>
              <div>
                <p className="font-semibold text-sm" style={{ margin: 0 }}>
                  Apply for staff leave
                </p>
                <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                  Approved leave automatically marks those dates as Leave (L) on your staff attendance record.
                </p>
              </div>
              <div className="wa-meta-row">
                <label className="grow">
                  <span className="text-xs font-medium muted">From date</span>
                  <input
                    type="date"
                    className="input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </label>
                <label className="grow">
                  <span className="text-xs font-medium muted">To date</span>
                  <input
                    type="date"
                    className="input"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                <span className="text-xs font-medium muted">Reason for leave</span>
                <input
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Personal leave / medical checkup / official duty"
                  required
                />
              </label>
              {flash && (
                <p className="text-11 tone-success row" style={{ gap: 6, margin: 0 }}>
                  <ShieldCheck size={14} /> {flash}
                </p>
              )}
              <button type="submit" className="btn-primary">
                Submit staff leave request
              </button>
            </form>
          )}

          <h2 className="section-label">My leave history</h2>
          <LeaveHistoryList items={history} />
        </>
      ) : (
        /* Student / Parent View */
        <>
          <div className="summary-card mt-2">
            <div className="ring" style={{ ["--p" as string]: `${leaveStats.pct}%` }}>
              <div className="ring-inner">{leaveStats.pct}%</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                {leaveStats.pct >= 85 ? "Healthy attendance" : "Needs attention"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.88 }}>
                {leaveStats.present} present · {leaveStats.absent} absent · {leaveStats.leave} leave this month
              </div>
            </div>
          </div>

          <div className="month-nav">
            <div className="arrow-btn">‹</div>
            <div className="m-title">{monthLabel}</div>
            <div className="arrow-btn">›</div>
          </div>

          <div className="cal-grid">
            <div className="cal-dow">S</div>
            <div className="cal-dow">M</div>
            <div className="cal-dow">T</div>
            <div className="cal-dow">W</div>
            <div className="cal-dow">T</div>
            <div className="cal-dow">F</div>
            <div className="cal-dow">S</div>
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="cal-day blank" />;
              const st = statusMap[d];
              const cls = st === "P" ? "p" : st === "A" ? "a" : st === "L" ? "l" : st === "H" ? "h" : "blank";
              return (
                <div key={i} className={`cal-day ${cls}`}>
                  {d}
                </div>
              );
            })}
          </div>

          <div className="legend mb-3">
            <Legend color="var(--success)" label="Present" />
            <Legend color="var(--danger)" label="Absent" />
            <Legend color="var(--info)" label="Leave" />
            <Legend color="var(--warning)" label="Half" />
          </div>

          <div className="hw-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
            <div>
              <div className="font-bold text-sm" style={{ marginBottom: 2 }}>Need a day off?</div>
              <div className="text-11 muted">Submit leave application to teacher</div>
            </div>
            <button
              type="button"
              onClick={() => setShowApplyForm((prev) => !prev)}
              className="icon-btn"
              style={{
                background: "var(--primary)",
                color: "#ffffff",
                boxShadow: "var(--shadow-pop)",
                border: "none",
                cursor: "pointer",
                width: 36,
                height: 36,
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "999px",
                transition: "transform 0.2s ease",
                transform: showApplyForm ? "rotate(45deg)" : "none",
              }}
              title={showApplyForm ? "Close leave form" : "Apply for leave"}
            >
              +
            </button>
          </div>

          {showApplyForm && (
            <form className="card card-pad mt-3 space-y" onSubmit={onApply}>
              <div>
                <p className="font-semibold text-sm" style={{ margin: 0 }}>
                  Apply for leave
                </p>
                <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                  Approved leave automatically marks those dates as Leave (L) on the attendance record.
                </p>
              </div>
              {user?.role === "parent" && (
                <label>
                  <span className="text-xs font-medium muted">Student name</span>
                  <input
                    className="input"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder={user?.childName || "Aarav Sharma"}
                  />
                </label>
              )}
              <div className="wa-meta-row">
                <label className="grow">
                  <span className="text-xs font-medium muted">Leave Category</span>
                  <select
                    className="input text-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LeaveCategory)}
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick / Medical Leave</option>
                    <option value="duty">Official Duty</option>
                    <option value="emergency">Emergency</option>
                    <option value="vacation">Vacation</option>
                  </select>
                </label>
                <label className="grow">
                  <span className="text-xs font-medium muted">From date</span>
                  <input
                    type="date"
                    className="input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </label>
                <label className="grow">
                  <span className="text-xs font-medium muted">To date</span>
                  <input
                    type="date"
                    className="input"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                <span className="text-xs font-medium muted">Reason for leave</span>
                <input
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Medical illness / family function / travel"
                  required
                />
              </label>
              {flash && (
                <p className="text-11 tone-success row" style={{ gap: 6, margin: 0 }}>
                  <ShieldCheck size={14} /> {flash}
                </p>
              )}
              <button type="submit" className="btn-primary">
                Submit leave request
              </button>
            </form>
          )}

          <h2 className="section-label">Leave history</h2>
          <LeaveHistoryList items={history} />
        </>
      )}

      {/* Historic Roster Unlock Modal */}
      {showUnlockModal && (
        <div className="modal-backdrop">
          <form className="modal-card space-y" onSubmit={onUnlockSubmit}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="font-bold text-base" style={{ margin: 0 }}>
                Unlock Roster: {selectedDate}
              </h3>
              <button
                type="button"
                className="btn-secondary text-xs"
                style={{ width: "auto", padding: "0.2rem 0.6rem" }}
                onClick={() => setShowUnlockModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="text-xs muted" style={{ margin: "4px 0 0" }}>
              As Principal/Admin, unlocking past locked dates enables editing historic roll calls and logs an immutable entry to the Audit Trail.
            </p>
            <label>
              <span className="text-xs font-medium muted">Audit Log Reason (Required)</span>
              <textarea
                className="input text-xs"
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g. Approved historic correction due to late medical certificate submission."
                required
              />
            </label>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary grow">
                Authorize & Unlock Roster
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowUnlockModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
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
      <EmptyState
        icon={CalendarCheck}
        tone="teal"
        title="No leave history yet"
        body="Approved and pending leave requests will show up here."
      />
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
