"use client";

import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import {
  ROLE_LABEL,
  isSchoolAdmin,
  isSuperAdmin,
  nextClassName,
  type Role,
  useAuth,
} from "@/lib/providers/auth";
import { useAdminData } from "@/lib/providers/admin-data";
import { useTeacherClass } from "@/lib/providers/teacher-class";
import { EnrollmentDesk } from "@/components/admin/EnrollmentDesk";
import {
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "@/components/shell/Icons";
import { LoadingBlock } from "@/components/shell/StatusUI";
import { apiFetch } from "@/lib/shared/api-client";
import { canAccessErpConsole } from "@schoolconnect/shared";

type Tab =
  | "overview"
  | "users"
  | "enroll"
  | "promotions"
  | "sessions"
  | "schools"
  | "attendance";

type AttendanceReport = {
  month: string;
  summary: {
    pending: number;
    approvedMonth: number;
    rejectedMonth: number;
    leaveMarksMonth: number;
  };
  leaves: Array<{
    id: string;
    studentName: string;
    className?: string;
    fromDate: string;
    toDate: string;
    reason: string;
    status: string;
    reviewedBy?: string;
    applicantName: string;
  }>;
  classes: Array<{
    className: string;
    rosterCount: number;
    leaveMarksMonth: number;
    presentToday: number;
    leaveToday: number;
    markedToday: number;
  }>;
};

const ASSIGNABLE_ROLES: Role[] = [
  "parent",
  "student",
  "class_teacher",
  "bus_attendant",
  "principal",
  "admin",
  "accountant",
];

export default function AdminPage() {
  const { user, listUsers, refreshUser } = useAuth();
  const admin = useAdminData();
  const teacherClass = useTeacherClass();
  const [tab, setTab] = useState<Tab>("overview");
  const [decisions, setDecisions] = useState<
    Record<string, "pass" | "fail">
  >({});
  const [flash, setFlash] = useState<string | null>(null);
  const [attendanceReport, setAttendanceReport] =
    useState<AttendanceReport | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const users = listUsers();
  const students = users.filter((u) => u.role === "student");
  const schoolUsers = user
    ? users.filter(
        (u) =>
          isSuperAdmin(user) ||
          u.school.toLowerCase() === user.school.toLowerCase(),
      )
    : [];

  const promoTargets = useMemo(() => {
    if (students.length > 0) {
      return students.map((s) => ({
        id: s.id,
        name: s.name,
        className: s.className || "—",
        source: "account" as const,
      }));
    }
    return teacherClass.roster.map((s) => ({
      id: s.id,
      name: s.name,
      className: s.className || "6-B",
      source: "roster" as const,
    }));
  }, [students, teacherClass.roster]);

  useEffect(() => {
    if (tab !== "attendance" || !user || !isSchoolAdmin(user)) return;
    let cancelled = false;
    setAttendanceLoading(true);
    void apiFetch<AttendanceReport>("/api/attendance/report")
      .then((res) => {
        if (!cancelled) setAttendanceReport(res);
      })
      .catch(() => {
        if (!cancelled) setAttendanceReport(null);
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, user]);

  if (!user || !admin.ready || !teacherClass.ready) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening admin console…" splash />
      </div>
    );
  }

  if (!isSchoolAdmin(user)) {
    return (
      <PhoneShell title="Admin" subtitle="Access restricted">
        <section className="card card-pad">
          <p className="font-semibold">School Admin only</p>
          <p className="text-sm muted mt-1">
            Sign up or switch to <strong>School Admin</strong> or{" "}
            <strong>Super Admin</strong> to open this console. Your saved role
            cannot be changed from profile after setup — an admin must update
            it.
          </p>
        </section>
      </PhoneShell>
    );
  }

  const superMode = isSuperAdmin(user);
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "enroll", label: "Enroll" },
    { id: "promotions", label: "Promote" },
    { id: "attendance", label: "Attendance" },
    { id: "sessions", label: "Session" },
    ...(superMode ? [{ id: "schools" as const, label: "Schools" }] : []),
  ];

  const runPromotion = () => {
    const picks = Object.entries(decisions).map(([studentId, result]) => ({
      studentId,
      result,
    }));
    if (!picks.length) {
      setFlash("Select Pass or Retain for at least one student.");
      return;
    }

    const sessionId = admin.activeSession?.id || "ay-2025-26";
    let summary: string;

    if (students.length > 0) {
      const results = admin.promoteStudents({
        sessionId,
        decisions: picks,
        actor: user,
      });
      refreshUser();
      summary = results
        .map(
          (r) =>
            `${r.name}: ${r.fromClass} → ${r.toClass || r.fromClass} (${r.result})`,
        )
        .join(" · ");
    } else {
      const rosterResults = teacherClass.promoteRoster(picks);
      admin.promoteStudents({
        sessionId,
        decisions: [],
        actor: user,
        externalResults: rosterResults,
      });
      summary = rosterResults
        .map(
          (r) =>
            `${r.name}: ${r.fromClass} → ${r.toClass} (${r.result})`,
        )
        .join(" · ");
    }

    setDecisions({});
    setFlash(summary || "Promotion applied.");
  };

  const markAllPass = () => {
    const next: Record<string, "pass" | "fail"> = {};
    promoTargets.forEach((t) => {
      next[t.id] = "pass";
    });
    setDecisions(next);
  };

  return (
    <PhoneShell
      title={superMode ? "Super Admin" : "School Admin"}
      subtitle={admin.activeSession?.label || "Console"}
      rightSlot={<ShieldCheck size={18} />}
    >
      <div className="admin-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {flash && (
        <div className="card card-pad mt-3" style={{ borderColor: "#86efac" }}>
          <p className="text-sm" style={{ margin: 0 }}>
            {flash}
          </p>
          <button
            type="button"
            className="btn-ghost text-xs mt-2"
            onClick={() => setFlash(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y mt-3">
          <section className="list-hero list-hero-blue" style={{ marginBottom: 0 }}>
            <p className="list-hero-kicker">
              {superMode ? "Platform control" : "School control"}
            </p>
            <h2 className="list-hero-title">{user.school}</h2>
            <p className="list-hero-body">
              Users, promotions and sessions · Active{" "}
              {admin.activeSession?.label || "—"}
            </p>
          </section>

          <div className="teacher-stats">
            <div className="teacher-stat">
              <p className="teacher-stat-value">{schoolUsers.length}</p>
              <p className="text-11 muted">Users</p>
            </div>
            <div className="teacher-stat">
              <p className="teacher-stat-value">
                {schoolUsers.filter((u) => u.role === "student").length ||
                  teacherClass.roster.length}
              </p>
              <p className="text-11 muted">Students</p>
            </div>
            <div className="teacher-stat">
              <p className="teacher-stat-value">
                {
                  schoolUsers.filter(
                    (u) =>
                      u.role === "class_teacher" || u.role === "principal",
                  ).length
                }
              </p>
              <p className="text-11 muted">Staff</p>
            </div>
            <div className="teacher-stat">
              <p className="teacher-stat-value">
                {admin.promotionLog.length}
              </p>
              <p className="text-11 muted">Promos</p>
            </div>
          </div>

          <section className="card card-pad">
            <p className="font-semibold text-sm">What School Admin can do</p>
            <ul className="admin-bullets">
              <li>Invite teachers with shareable codes</li>
              <li>Add students & approve class enrollment</li>
              <li>Assign roles (except Super Admin)</li>
              <li>Run annual grade promotion (pass → next class)</li>
              <li>Complete / start academic sessions</li>
              <li>Oversee circulars & class operations via staff</li>
              <li>Review leave requests & class attendance marks</li>
              {canAccessErpConsole(user?.role, {
                productMode: user?.productMode,
              }) ? (
                <li>
                  Open desktop{" "}
                  <a href="/erp" className="tone-primary font-semibold">
                    School ERP
                  </a>{" "}
                  for students, admissions, fees &amp; staff MDM
                </li>
              ) : (
                <li>
                  School is on <strong>Connect</strong> mode — full ERP unlocks
                  when Super Admin sets product mode to ERP
                </li>
              )}
              <li>
                Campus transfers (group or open destination):{" "}
                <a href="/transfers" className="tone-primary font-semibold">
                  /transfers
                </a>
              </li>
            </ul>
          </section>

          {superMode && (
            <section className="card card-pad">
              <p className="font-semibold text-sm">What Super Admin can do</p>
              <ul className="admin-bullets">
                <li>Manage multiple schools (activate / pause)</li>
                <li>Promote users to School Admin</li>
                <li>Assign Super Admin (platform-only)</li>
                <li>See cross-school user directory</li>
                <li>Everything a School Admin can do</li>
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y mt-3">
          <p className="text-xs muted">
            Role chosen at profile setup is saved permanently for that phone /
            email. Re-login restores the same role. Admins can reassign below.
          </p>
          {schoolUsers.length === 0 && (
            <section className="card card-pad">
              <p className="text-sm muted">
                No users yet. Ask people to sign up — their selected role is
                stored with their account.
              </p>
            </section>
          )}
          {schoolUsers.map((u) => (
            <section key={u.id} className="card card-pad">
              <div className="row">
                <div className="grow">
                  <p className="font-semibold text-sm" style={{ margin: 0 }}>
                    {u.name}
                  </p>
                  <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                    {u.identifier} · {ROLE_LABEL[u.role]}
                    {u.className ? ` · ${u.className}` : ""}
                    {u.enrollmentStatus
                      ? ` · ${u.enrollmentStatus}`
                      : ""}
                  </p>
                </div>
              </div>
              <label className="mt-2" style={{ display: "block" }}>
                <span className="text-11 muted">Change role</span>
                <select
                  className="input"
                  value={u.role}
                  disabled={u.id === user.id && !superMode}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    admin.setUserRole(u.id, role, user);
                    refreshUser();
                    setFlash(`${u.name} → ${ROLE_LABEL[role]}`);
                  }}
                >
                  {(superMode
                    ? [...ASSIGNABLE_ROLES, "super_admin" as Role]
                    : ASSIGNABLE_ROLES
                  ).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </label>
              {(u.role === "student" || u.role === "class_teacher") && (
                <label className="mt-2" style={{ display: "block" }}>
                  <span className="text-11 muted">Class</span>
                  <input
                    className="input"
                    defaultValue={u.className || ""}
                    placeholder="6-B"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== u.className) {
                        admin.setUserClass(u.id, v, user);
                        refreshUser();
                        setFlash(`${u.name} class → ${v}`);
                      }
                    }}
                  />
                </label>
              )}
              {u.enrollmentStatus === "pending" &&
                u.id !== user.id &&
                (u.role === "student" ||
                  u.role === "class_teacher" ||
                  u.role === "principal" ||
                  u.role === "bus_attendant") && (
                  <div className="row mt-2" style={{ gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-primary grow"
                      onClick={() => {
                        admin.setUserEnrollmentStatus(u.id, "approved", user);
                        refreshUser();
                        setFlash(`${u.name} approved — full access unlocked`);
                      }}
                    >
                      Approve access
                    </button>
                    <button
                      type="button"
                      className="btn-secondary grow"
                      onClick={() => {
                        admin.setUserEnrollmentStatus(u.id, "rejected", user);
                        refreshUser();
                        setFlash(`${u.name} rejected`);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              {u.enrollmentStatus === "rejected" &&
                u.id !== user.id &&
                (user.role === "admin" ||
                  user.role === "super_admin" ||
                  user.role === "principal") && (
                  <button
                    type="button"
                    className="btn-secondary mt-2"
                    onClick={() => {
                      admin.setUserEnrollmentStatus(u.id, "approved", user);
                      refreshUser();
                      setFlash(`${u.name} re-approved`);
                    }}
                  >
                    Re-approve access
                  </button>
                )}
            </section>
          ))}
        </div>
      )}

      {tab === "enroll" && (
        <div className="mt-3">
          <EnrollmentDesk actor={user} onFlash={setFlash} />
        </div>
      )}

      {tab === "promotions" && (
        <div className="space-y mt-3">
          <section className="card card-pad">
            <div className="row">
              <GraduationCap size={18} className="tone-primary" />
              <div className="grow">
                <p className="font-semibold text-sm" style={{ margin: 0 }}>
                  Annual grade promotion
                </p>
                <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                  Session {admin.activeSession?.label || "—"}. Pass moves e.g.
                  6-B → 7-B. Fail retains the same class.
                </p>
              </div>
            </div>
            <div className="row mt-3" style={{ gap: "0.5rem" }}>
              <button type="button" className="btn-secondary grow" onClick={markAllPass}>
                Mark all Pass
              </button>
              <button type="button" className="btn-primary grow" onClick={runPromotion}>
                Apply promotion
              </button>
            </div>
          </section>

          {promoTargets.map((t) => {
            const next =
              t.className !== "—" ? nextClassName(t.className) : null;
            const pick = decisions[t.id];
            return (
              <section key={t.id} className="card card-pad">
                <div className="row">
                  <div className="grow">
                    <p className="font-semibold text-sm" style={{ margin: 0 }}>
                      {t.name}
                    </p>
                    <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                      Now {t.className}
                      {next ? ` · Pass → ${next}` : ""}
                      {t.source === "roster" ? " · demo roster" : ""}
                    </p>
                  </div>
                </div>
                <div className="mark-row mt-2">
                  <button
                    type="button"
                    className={`mark-btn ${pick === "pass" ? "on-P" : ""}`}
                    onClick={() =>
                      setDecisions((d) => ({ ...d, [t.id]: "pass" }))
                    }
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    className={`mark-btn ${pick === "fail" ? "on-A" : ""}`}
                    onClick={() =>
                      setDecisions((d) => ({ ...d, [t.id]: "fail" }))
                    }
                  >
                    Retain
                  </button>
                </div>
              </section>
            );
          })}

          {admin.promotionLog.length > 0 && (
            <section className="card card-pad">
              <p className="font-semibold text-sm">Recent promotion runs</p>
              {admin.promotionLog.slice(0, 5).map((log) => (
                <div key={log.id} className="mt-2">
                  <p className="text-11 muted" style={{ margin: 0 }}>
                    {new Date(log.at).toLocaleString()} · by {log.by}
                  </p>
                  {log.results.length === 0 ? (
                    <p className="text-xs">Session marked / logged</p>
                  ) : (
                    log.results.map((r) => (
                      <p key={r.studentId} className="text-xs" style={{ margin: "2px 0" }}>
                        {r.name}: {r.fromClass} → {r.toClass} (
                        {r.result === "pass" ? (
                          <CheckCircle2
                            size={12}
                            style={{ display: "inline", verticalAlign: "middle" }}
                          />
                        ) : (
                          <AlertCircle
                            size={12}
                            style={{ display: "inline", verticalAlign: "middle" }}
                          />
                        )}{" "}
                        {r.result})
                      </p>
                    ))
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y mt-3">
          <section className="list-hero list-hero-blue" style={{ marginBottom: 0 }}>
            <p className="list-hero-kicker">Teacher report</p>
            <h2 className="list-hero-title">Leave &amp; attendance</h2>
            <p className="list-hero-body">
              Approved leave auto-marks students as L on the class sheet. Month{" "}
              {attendanceReport?.month || "—"}.
            </p>
          </section>

          {attendanceLoading ? <LoadingBlock label="Loading report…" /> : null}

          {attendanceReport ? (
            <>
              <div className="teacher-stats">
                <div className="teacher-stat">
                  <p className="teacher-stat-value tone-warning">
                    {attendanceReport.summary.pending}
                  </p>
                  <p className="text-11 muted">Pending leaves</p>
                </div>
                <div className="teacher-stat">
                  <p className="teacher-stat-value tone-success">
                    {attendanceReport.summary.approvedMonth}
                  </p>
                  <p className="text-11 muted">Approved (month)</p>
                </div>
                <div className="teacher-stat">
                  <p className="teacher-stat-value">
                    {attendanceReport.summary.leaveMarksMonth}
                  </p>
                  <p className="text-11 muted">L marks (month)</p>
                </div>
                <div className="teacher-stat">
                  <p className="teacher-stat-value tone-destructive">
                    {attendanceReport.summary.rejectedMonth}
                  </p>
                  <p className="text-11 muted">Rejected (month)</p>
                </div>
              </div>

              <h2 className="section-label">Classes today</h2>
              {attendanceReport.classes.length === 0 ? (
                <p className="text-sm muted">No class desks yet.</p>
              ) : (
                attendanceReport.classes.map((c) => (
                  <section key={c.className} className="card card-pad" style={{ marginBottom: 8 }}>
                    <p className="font-semibold text-sm" style={{ margin: 0 }}>
                      Class {c.className}
                    </p>
                    <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                      Roster {c.rosterCount} · Today P {c.presentToday} · L{" "}
                      {c.leaveToday} · marked {c.markedToday} · Month L marks{" "}
                      {c.leaveMarksMonth}
                    </p>
                  </section>
                ))
              )}

              <h2 className="section-label">Recent leave requests</h2>
              {attendanceReport.leaves.length === 0 ? (
                <p className="text-sm muted">No leave requests.</p>
              ) : (
                attendanceReport.leaves.map((l) => (
                  <section key={l.id} className="card card-pad" style={{ marginBottom: 8 }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <p className="font-semibold text-sm" style={{ margin: 0 }}>
                        {l.studentName}
                      </p>
                      <span className="text-11 font-semibold" style={{ textTransform: "capitalize" }}>
                        {l.status}
                      </span>
                    </div>
                    <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                      {l.className ? `Class ${l.className} · ` : ""}
                      {l.fromDate}
                      {l.toDate !== l.fromDate ? ` → ${l.toDate}` : ""} · by{" "}
                      {l.applicantName}
                    </p>
                    <p className="text-xs" style={{ margin: "6px 0 0" }}>
                      {l.reason}
                    </p>
                    {l.reviewedBy ? (
                      <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                        Reviewed by {l.reviewedBy}
                      </p>
                    ) : null}
                  </section>
                ))
              )}
            </>
          ) : !attendanceLoading ? (
            <p className="text-sm muted">Could not load attendance report.</p>
          ) : null}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y mt-3">
          {admin.sessions.map((s) => (
            <section key={s.id} className="card card-pad">
              <div className="row">
                <Layers size={16} className="tone-primary" />
                <div className="grow">
                  <p className="font-semibold text-sm" style={{ margin: 0 }}>
                    AY {s.label}
                  </p>
                  <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                    {s.startsOn} → {s.endsOn} · {s.status}
                  </p>
                </div>
                <span
                  className={`chip ${s.status === "active" ? "chip-ok" : ""}`}
                >
                  {s.status}
                </span>
              </div>
              {s.status === "active" && (
                <button
                  type="button"
                  className="btn-secondary mt-3"
                  style={{ width: "100%" }}
                  onClick={() => {
                    admin.completeSession(s.id, user);
                    setFlash(`Session ${s.label} marked completed.`);
                  }}
                >
                  Mark session completed
                </button>
              )}
            </section>
          ))}
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => {
              const next = admin.startNextSession(user);
              setFlash(`Started academic year ${next.label}`);
            }}
          >
            Start next academic year
          </button>
        </div>
      )}

      {tab === "schools" && superMode && (
        <div className="space-y mt-3">
          <p className="text-xs muted">
            Super Admin manages the school network. Pause a school to freeze
            onboarding for that campus.
          </p>
          {admin.schools.map((s) => (
            <section key={s.id} className="card card-pad">
              <p className="font-semibold text-sm" style={{ margin: 0 }}>
                {s.name}
              </p>
              <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                {s.city} · {s.studentCount} students · {s.adminCount} admins
              </p>
              <button
                type="button"
                className="btn-secondary mt-3"
                style={{ width: "100%" }}
                onClick={() => {
                  admin.toggleSchoolStatus(s.id, user);
                  setFlash(
                    `${s.name} is now ${s.status === "active" ? "paused" : "active"}`,
                  );
                }}
              >
                {s.status === "active" ? "Pause school" : "Activate school"}
              </button>
            </section>
          ))}
        </div>
      )}
    </PhoneShell>
  );
}
