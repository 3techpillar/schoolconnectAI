"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth, type UserProfile } from "@/lib/providers/auth";
import {
  useTimetable,
  PERIOD_SLOTS,
  type DayOfWeek,
  type TimetableEntry,
  type SubstitutionRecord,
  type CandidateSubstitute,
} from "@/lib/providers/timetable";
import { useLeaves } from "@/lib/providers/leaves";
import { useStaffAttendance } from "@/lib/providers/staff-attendance";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { CalendarCheck, ShieldCheck } from "@/components/shell/Icons";
import { toIsoDate } from "@/lib/shared/dates";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { user } = useAuth();
  const {
    ready,
    entries,
    substitutions,
    getTimetableForClass,
    getTimetableForTeacher,
    getSubstitutionsForDate,
    getCandidateSubstitutes,
    runAutoSubstitutionForDate,
    manualAssignSubstitution,
  } = useTimetable();

  const { leaves } = useLeaves();
  const { staffRoster } = useStaffAttendance();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    const d = new Date().toLocaleDateString(undefined, { weekday: "long" }) as DayOfWeek;
    return DAYS.includes(d) ? d : "Monday";
  });
  const [selectedClass, setSelectedClass] = useState<string>(user?.className || "6-B");
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toIsoDate());
  const [activeTab, setActiveTab] = useState<"grid" | "teacher_schedule" | "substitutions">("grid");

  // Manual Substitution Modal State
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSubstitute | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isStaff = Boolean(user && user.role !== "student" && user.role !== "parent");
  const isAdminOrPrincipal = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "principal" ||
        user.role === "vice_principal" ||
        user.role === "super_admin"),
  );

  const dailySubstitutions = useMemo(() => {
    return getSubstitutionsForDate(selectedDateKey);
  }, [getSubstitutionsForDate, selectedDateKey]);

  const classSchedule = useMemo(() => {
    return getTimetableForClass(selectedClass, selectedDay);
  }, [getTimetableForClass, selectedClass, selectedDay]);

  const teacherSchedule = useMemo(() => {
    if (!user) return [];
    return getTimetableForTeacher(user.id, selectedDay);
  }, [getTimetableForTeacher, user, selectedDay]);

  const mySubstitutionsToday = useMemo(() => {
    if (!user) return [];
    return dailySubstitutions.filter((s) => s.substituteTeacherId === user.id);
  }, [dailySubstitutions, user]);

  const candidatesForEditing = useMemo(() => {
    if (!editingEntry) return [];
    return getCandidateSubstitutes(
      editingEntry.day,
      editingEntry.periodNo,
      editingEntry.subject,
      editingEntry.department,
      editingEntry.teacherId,
    );
  }, [editingEntry, getCandidateSubstitutes]);

  const handleAutoSubstitutionRun = (teacherId: string, teacherName: string) => {
    if (!user) return;
    const generated = runAutoSubstitutionForDate(selectedDateKey, teacherId, user);
    setToastMessage(`Generated ${generated.length} auto-substitutions for ${teacherName}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmSubstitution = () => {
    if (!editingEntry || !selectedCandidate || !user) return;
    manualAssignSubstitution({
      dateKey: selectedDateKey,
      periodNo: editingEntry.periodNo,
      className: editingEntry.className,
      subject: editingEntry.subject,
      originalTeacherId: editingEntry.teacherId,
      originalTeacherName: editingEntry.teacherName,
      substituteTeacherId: selectedCandidate.teacherId,
      substituteTeacherName: selectedCandidate.teacherName,
      roomNo: editingEntry.roomNo,
      actor: user,
    });
    setEditingEntry(null);
    setSelectedCandidate(null);
    setToastMessage(`Assigned ${selectedCandidate.teacherName} to cover ${editingEntry.className} Period ${editingEntry.periodNo}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!ready) {
    return (
      <PhoneShell subtitle="Weekly schedule & cover" title="Timetable">
        <LoadingBlock label="Loading timetable grid…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      subtitle={
        activeTab === "grid"
          ? `Class ${selectedClass} · ${selectedDay}`
          : activeTab === "teacher_schedule"
          ? `Personal Schedule · ${selectedDay}`
          : `Automated Substitution Hub (${selectedDateKey})`
      }
      title="Timetable"
      headerAccent="plain"
    >
      {toastMessage && <div className="engage-toast">{toastMessage}</div>}

      <section className="list-hero list-hero-purple">
        <p className="list-hero-kicker">Schedule & Auto-Substitution</p>
        <h2 className="list-hero-title">Timetable Engine</h2>
        <p className="list-hero-body">
          Weekly period schedule, room allocations, and 1-click teacher substitution roster.
        </p>
      </section>

      {/* View Selector Tabs */}
      <div className="admin-tabs mt-3 mb-2" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
        <button
          type="button"
          className={`admin-tab ${activeTab === "grid" ? "active" : ""}`}
          onClick={() => setActiveTab("grid")}
        >
          Class Timetable
        </button>
        {isStaff && (
          <button
            type="button"
            className={`admin-tab ${activeTab === "teacher_schedule" ? "active" : ""}`}
            onClick={() => setActiveTab("teacher_schedule")}
          >
            My Teaching Schedule
          </button>
        )}
        {isAdminOrPrincipal && (
          <button
            type="button"
            className={`admin-tab ${activeTab === "substitutions" ? "active" : ""}`}
            onClick={() => setActiveTab("substitutions")}
          >
            Auto-Substitution Hub {dailySubstitutions.length ? `(${dailySubstitutions.length})` : ""}
          </button>
        )}
      </div>

      {/* Day Selector (Mon-Sat) */}
      {activeTab !== "substitutions" && (
        <div className="card card-pad mt-2 mb-3" style={{ overflowX: "auto" }}>
          <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={`btn-secondary text-xs ${selectedDay === day ? "btn-primary" : ""}`}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "999px", flexShrink: 0 }}
                onClick={() => setSelectedDay(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CLASS TIMETABLE GRID VIEW */}
      {activeTab === "grid" && (
        <>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="text-xs font-semibold muted">Target Class:</span>
            <select
              className="input text-xs font-semibold"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="6-B">Class 6-B</option>
              <option value="10-A">Class 10-A</option>
              <option value="3-A">Class 3-A</option>
            </select>
          </div>

          <h2 className="section-label">
            {selectedDay} Schedule — Class {selectedClass}
          </h2>

          <div className="space-y mt-2">
            {PERIOD_SLOTS.map((slot) => {
              if (slot.isBreak) {
                return (
                  <div
                    key={slot.periodNo}
                    className="card card-pad"
                    style={{
                      background: "var(--surface-muted, #f8fafc)",
                      borderStyle: "dashed",
                      padding: "0.6rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    <span className="text-xs font-bold muted">
                      ☕ {slot.label} ({slot.startTime} – {slot.endTime})
                    </span>
                  </div>
                );
              }

              const entry = classSchedule.find((e) => e.periodNo === slot.periodNo);
              const sub = dailySubstitutions.find(
                (s) => s.periodNo === slot.periodNo && s.className === selectedClass,
              );

              return (
                <div key={slot.periodNo} className="card card-pad">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span className="text-11 font-bold tone-primary">
                        {slot.label} · {slot.startTime} – {slot.endTime}
                      </span>
                      {entry ? (
                        <p className="font-bold text-base mt-1" style={{ margin: "2px 0 0" }}>
                          {entry.subject}
                        </p>
                      ) : (
                        <p className="text-sm muted mt-1" style={{ margin: "2px 0 0", fontStyle: "italic" }}>
                          Free Period / Self Study
                        </p>
                      )}
                    </div>
                    {entry && (
                      <span className="badge badge-teal text-11" style={{ fontWeight: 600 }}>
                        📍 {entry.roomNo}
                      </span>
                    )}
                  </div>

                  {entry && (
                    <div className="row mt-2" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <p className="text-xs muted" style={{ margin: 0 }}>
                        Teacher: <strong>{sub ? sub.originalTeacherName : entry.teacherName}</strong>
                      </p>

                      {isAdminOrPrincipal && (
                        <button
                          type="button"
                          className="tone-primary font-semibold text-xs"
                          onClick={() => setEditingEntry(entry)}
                        >
                          {sub ? "Edit Cover" : "+ Assign Substitute"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Substitution Highlight Badge */}
                  {sub && (
                    <div
                      className="card card-pad mt-2"
                      style={{
                        background: "var(--warning-subtle, #fefce8)",
                        borderColor: "#fde047",
                        padding: "0.5rem 0.75rem",
                      }}
                    >
                      <div className="row" style={{ gap: 6, alignItems: "center" }}>
                        <span className="text-sm">⚡</span>
                        <div>
                          <p className="font-bold text-xs tone-warning" style={{ margin: 0 }}>
                            Substitute Cover: {sub.substituteTeacherName} ({sub.substituteRole.replace("_", " ")})
                          </p>
                          <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                            Assigned by {sub.assignedBy} · {sub.matchType.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TEACHER PERSONAL SCHEDULE VIEW */}
      {activeTab === "teacher_schedule" && isStaff && (
        <>
          {mySubstitutionsToday.length > 0 && (
            <div className="card card-pad mb-3" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <h3 className="font-bold text-sm tone-primary" style={{ margin: 0 }}>
                ⚡ You have {mySubstitutionsToday.length} Cover Substitution(s) Today ({selectedDateKey})
              </h3>
              <ul className="space-y mt-2">
                {mySubstitutionsToday.map((s) => (
                  <li key={s.id} className="text-xs">
                    <strong>Period {s.periodNo}</strong> ({s.subject}) in <strong>Class {s.className}</strong> (📍 {s.roomNo}) — Covering for {s.originalTeacherName}.
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="section-label">
            My Teaching Schedule — {selectedDay} ({user?.name})
          </h2>

          <div className="space-y mt-2">
            {PERIOD_SLOTS.map((slot) => {
              if (slot.isBreak) return null;
              const entry = teacherSchedule.find((e) => e.periodNo === slot.periodNo);

              return (
                <div key={slot.periodNo} className="card card-pad">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span className="text-11 font-bold tone-primary">
                        {slot.label} ({slot.startTime} – {slot.endTime})
                      </span>
                      {entry ? (
                        <p className="font-bold text-sm mt-1" style={{ margin: "2px 0 0" }}>
                          Class {entry.className} — {entry.subject}
                        </p>
                      ) : (
                        <p className="text-xs tone-success font-semibold mt-1" style={{ margin: "2px 0 0" }}>
                          🟢 Free Period (Available for Cover)
                        </p>
                      )}
                    </div>
                    {entry && (
                      <span className="badge badge-teal text-11" style={{ fontWeight: 600 }}>
                        📍 {entry.roomNo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ADMIN AUTOMATED SUBSTITUTION HUB */}
      {activeTab === "substitutions" && isAdminOrPrincipal && (
        <>
          <div className="card card-pad mb-3">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="text-xs font-semibold muted">Target Date:</span>
                <input
                  type="date"
                  className="input text-xs font-semibold mt-1"
                  value={selectedDateKey}
                  onChange={(e) => setSelectedDateKey(e.target.value)}
                  style={{ width: "auto" }}
                />
              </div>
              <span className="text-xs font-bold tone-primary">
                {dailySubstitutions.length} Cover(s) Active
              </span>
            </div>
          </div>

          <h2 className="section-label">1-Click Auto-Substitution Generator</h2>
          <div className="card card-pad space-y mb-4">
            <p className="text-xs muted" style={{ margin: 0 }}>
              Select a teacher on leave to scan affected periods and auto-rank available free teachers:
            </p>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {staffRoster.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="btn-secondary text-xs"
                  style={{ padding: "0.4rem 0.8rem", width: "auto" }}
                  onClick={() => handleAutoSubstitutionRun(s.id, s.name)}
                >
                  ⚡ Run Auto-Sub for {s.name}
                </button>
              ))}
            </div>
          </div>

          <h2 className="section-label">Daily Substitution Roster ({selectedDateKey})</h2>
          {dailySubstitutions.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              tone="teal"
              title="No substitutions assigned for this date"
              body="Use 1-Click Auto-Substitution or tap any period in Class Timetable to assign a substitute teacher."
            />
          ) : (
            <ul className="leave-list mt-2">
              {dailySubstitutions.map((sub) => (
                <li key={sub.id} className="card card-pad">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p className="font-bold text-sm" style={{ margin: 0 }}>
                        Class {sub.className} · Period {sub.periodNo} ({sub.subject})
                      </p>
                      <p className="text-xs muted" style={{ margin: "2px 0 0" }}>
                        Original: <strong>{sub.originalTeacherName}</strong> $\rightarrow$ Substitute: <strong className="tone-primary">{sub.substituteTeacherName}</strong>
                      </p>
                    </div>
                    <span className="badge badge-teal text-11">📍 {sub.roomNo}</span>
                  </div>
                  <div className="row mt-2" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <span className="text-11 muted">
                      Assigned by {sub.assignedBy} · <strong className="text-capitalize">{sub.matchType.replace("_", " ")}</strong>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Manual Substitution Assignment Modal */}
      {editingEntry && (
        <div className="modal-backdrop">
          <div className="modal-card space-y">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="font-bold text-base" style={{ margin: 0 }}>
                Assign Substitute: Class {editingEntry.className} (Period {editingEntry.periodNo})
              </h3>
              <button
                type="button"
                className="btn-secondary text-xs"
                style={{ width: "auto", padding: "0.2rem 0.6rem" }}
                onClick={() => setEditingEntry(null)}
              >
                ✕
              </button>
            </div>
            <p className="text-xs muted" style={{ margin: "4px 0 0" }}>
              Subject: <strong>{editingEntry.subject}</strong> | Original Teacher: <strong>{editingEntry.teacherName}</strong>
            </p>

            <span className="text-xs font-semibold muted">Ranked Available Free Teachers:</span>
            {candidatesForEditing.length === 0 ? (
              <p className="text-xs tone-danger font-medium">No available free teachers found for this period slot.</p>
            ) : (
              <ul className="space-y mt-2" style={{ maxHeight: 200, overflowY: "auto" }}>
                {candidatesForEditing.map((c) => (
                  <li
                    key={c.teacherId}
                    className={`card card-pad row ${selectedCandidate?.teacherId === c.teacherId ? "card-highlight" : ""}`}
                    style={{
                      cursor: "pointer",
                      justifyContent: "space-between",
                      borderColor: selectedCandidate?.teacherId === c.teacherId ? "var(--primary)" : undefined,
                    }}
                    onClick={() => setSelectedCandidate(c)}
                  >
                    <div>
                      <p className="font-semibold text-xs" style={{ margin: 0 }}>
                        {c.teacherName} ({c.role.replace("_", " ")})
                      </p>
                      <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                        {c.matchLabel}
                      </p>
                    </div>
                    {selectedCandidate?.teacherId === c.teacherId && (
                      <span className="tone-primary font-bold">✓ Selected</span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="row mt-3" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn-primary grow"
                disabled={!selectedCandidate}
                onClick={handleConfirmSubstitution}
              >
                Confirm Substitution Assignment
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingEntry(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
