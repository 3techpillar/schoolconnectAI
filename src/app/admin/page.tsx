"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
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
import { EnrollmentDesk } from "@/components/EnrollmentDesk";
import {
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "@/components/Icons";

type Tab = "overview" | "users" | "enroll" | "promotions" | "sessions" | "schools";

const ASSIGNABLE_ROLES: Role[] = [
  "parent",
  "student",
  "class_teacher",
  "bus_attendant",
  "principal",
  "admin",
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

  if (!user || !admin.ready || !teacherClass.ready) {
    return <div className="app-shell" />;
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
          <section className="admin-hero">
            <p className="text-11" style={{ margin: 0, opacity: 0.85 }}>
              {superMode ? "Platform control" : "School control"}
            </p>
            <p className="font-semibold text-15" style={{ margin: "4px 0 0" }}>
              {user.school}
            </p>
            <p className="text-xs" style={{ margin: "6px 0 0", opacity: 0.9 }}>
              Role locked at signup · Active session{" "}
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
