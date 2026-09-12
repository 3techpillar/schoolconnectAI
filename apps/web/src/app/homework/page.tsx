"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import {
  useSchoolData,
  type HomeworkPriority,
  type HomeworkStatus,
} from "@/lib/providers/school-data";
import { useStudentEngage } from "@/lib/providers/student-engage";
import {
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  BookOpen,
} from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { addDaysIso, formatDueLabel, isDueOverdue, toIsoDate } from "@/lib/shared/dates";

export default function HomeworkPage() {
  const { user } = useAuth();
  const {
    homework,
    addHomework,
    updateHomeworkStatus,
    canPostAsTeacher,
    ready,
  } = useSchoolData();
  const { completeMission, awardXp } = useStudentEngage();

  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("Math");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(addDaysIso(toIsoDate(), 2));
  const [priority, setPriority] = useState<HomeworkPriority>("medium");

  const teacher = canPostAsTeacher(user);

  const filtered = useMemo(() => {
    if (filter === "All") return homework;
    return homework.filter((h) => h.subject === filter);
  }, [filter, homework]);

  const counts = useMemo(() => {
    return {
      pending: homework.filter((h) => h.status === "pending").length,
      progress: homework.filter((h) => h.status === "in-progress").length,
      done: homework.filter(
        (h) => h.status === "submitted" || h.status === "reviewed",
      ).length,
      overdue: homework.filter((h) => isDueOverdue(h.dueDate, h.status)).length,
    };
  }, [homework]);

  const subjects = ["All", "Math", "Science", "English", "Hindi"];

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !dueDate) return;
    addHomework(
      {
        subject,
        title: title.trim(),
        dueDate,
        due: formatDueLabel(dueDate),
        priority,
        attachments: 0,
        status: "pending",
        className: user.className || "6-B",
        postedBy: user.name,
      },
      user,
    );
    setTitle("");
    setDueDate(addDaysIso(toIsoDate(), 2));
    setShowForm(false);
  };

  const cycleStatus = (id: string, current: HomeworkStatus) => {
    if (!user) return;
    const order: HomeworkStatus[] = [
      "pending",
      "in-progress",
      "submitted",
      "reviewed",
    ];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateHomeworkStatus(id, next, user);
    if (next === "in-progress" || next === "submitted") {
      completeMission("mission-homework");
      awardXp(next === "submitted" ? 20 : 10);
    }
  };

  if (!ready) {
    return (
      <PhoneShell title="Homework" subtitle="Assignments">
        <LoadingBlock label="Loading homework…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      subtitle={`${counts.pending + counts.progress} active · ${counts.overdue} overdue`}
      title="Homework"
      headerAccent="plain"
    >
      {/* 4-KPI Row */}
      <div className="kpi-row mt-2">
        <div className="kpi">
          <div className="n" style={{ color: "var(--warning)" }}>{counts.pending}</div>
          <div className="l">Pending</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ color: "var(--info)" }}>{counts.progress}</div>
          <div className="l">In progress</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ color: "var(--success)" }}>{counts.done}</div>
          <div className="l">Done</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ color: "var(--danger)" }}>{counts.overdue}</div>
          <div className="l">Overdue</div>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="row mt-4" style={{ justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div className="chip-row" style={{ flex: 1, paddingBottom: 2 }}>
          {subjects.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {teacher && (
          <button
            type="button"
            className="icon-btn"
            style={{
              background: showForm ? "var(--blue-tint)" : "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
              flexShrink: 0,
            }}
            aria-label="Add homework"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Teacher Post Drawer */}
      {teacher && showForm && (
        <form className="card card-pad mt-3 space-y" onSubmit={onCreate} style={{ borderColor: "rgba(37, 99, 235, 0.3)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              Assign Class Homework
            </p>
            <span className="text-10 muted">Class {user?.className || "6-B"}</span>
          </div>
          <div className="wa-meta-row">
            <select
              className="wa-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {["Math", "Science", "English", "Hindi"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="wa-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as HomeworkPriority)}
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment description / exercises"
            required
          />
          <label>
            <span className="text-xs font-medium muted">Submission deadline</span>
            <input
              type="date"
              className="input"
              value={dueDate}
              min={toIsoDate()}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary">
            Post Homework Assignment
          </button>
        </form>
      )}

      {/* Homework Cards List */}
      <ul className="hw-container">
        {filtered.map((it) => {
          const overdue = isDueOverdue(it.dueDate, it.status);
          const isDone = it.status === "submitted" || it.status === "reviewed";
          return (
            <li key={it.id} className={`hw-card ${overdue ? "is-overdue" : ""} ${isDone ? "is-submitted" : ""}`}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="row" style={{ gap: 6, alignItems: "center" }}>
                  <span className={`hw-subject-tag hw-subject-${it.subject}`}>
                    {it.subject}
                  </span>
                  <span className={`hw-priority-pill hw-priority-${it.priority}`}>
                    {it.priority}
                  </span>
                </div>
                <span
                  className={`text-11 ${overdue ? "tone-destructive font-semibold" : "muted"}`}
                  style={{
                    display: "inline-flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  <Clock size={12} />
                  {overdue ? "Overdue · " : "Due "}
                  {it.due}
                </span>
              </div>

              <h3 className="font-semibold text-15 mt-2" style={{ margin: "0.5rem 0 0.25rem", color: "var(--foreground)" }}>
                {it.title}
              </h3>

              <p className="text-11 muted" style={{ margin: "0 0 0.75rem" }}>
                Class {it.className} · Posted by {it.postedBy}
              </p>

              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                <div className="row text-xs muted" style={{ gap: "0.75rem", alignItems: "center" }}>
                  {it.attachments > 0 && (
                    <span className="row" style={{ gap: 4 }}>
                      <Paperclip size={13} /> {it.attachments}
                    </span>
                  )}
                  <StatusPill status={it.status} />
                </div>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  {it.status !== "submitted" && it.status !== "reviewed" && (
                    <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700 }}>
                      +20 XP
                    </span>
                  )}
                  <button
                    type="button"
                    className="hw-cycle-btn"
                    onClick={() => cycleStatus(it.id, it.status)}
                  >
                    {it.status === "pending"
                      ? "Start task"
                      : it.status === "in-progress"
                        ? "Submit ✓"
                        : "Completed"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          tone="blue"
          title="No homework in this filter"
          body="Try another subject, or check back after your teacher posts."
        />
      ) : null}
    </PhoneShell>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "submitted" || status === "reviewed") {
    return (
      <span className="row tone-success font-medium" style={{ gap: 4 }}>
        <CheckCircle2 size={13} /> {status === "reviewed" ? "Reviewed" : "Submitted"}
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="row tone-info font-medium" style={{ gap: 4 }}>
        <Clock size={13} /> In progress
      </span>
    );
  }
  return (
    <span className="row tone-warning font-medium" style={{ gap: 4 }}>
      <AlertTriangle size={13} /> Pending
    </span>
  );
}
