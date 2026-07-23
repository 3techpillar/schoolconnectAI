"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/auth";
import {
  useSchoolData,
  type HomeworkPriority,
  type HomeworkStatus,
} from "@/lib/school-data";
import { useStudentEngage } from "@/lib/student-engage";
import {
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
} from "@/components/Icons";
import { addDaysIso, formatDueLabel, isDueOverdue, toIsoDate } from "@/lib/dates";

const subjectColor: Record<string, string> = {
  Math: "pill pill-info",
  Science: "pill pill-success",
  English: "pill pill-secondary",
  Hindi: "pill pill-warning",
};

const priorityClass: Record<string, string> = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

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
      <PhoneShell title="Homework" subtitle="Loading">
        <p className="muted text-sm">Loading…</p>
      </PhoneShell>
    );
  }

  return (
      <PhoneShell
      subtitle={`${counts.pending + counts.progress} active · ${counts.overdue} overdue`}
      title="Homework"
    >
      <div className="card card-pad summary-3">
        <Stat label="Pending" value={String(counts.pending)} tone="tone-warning" />
        <Stat label="In progress" value={String(counts.progress)} tone="tone-info" />
        <Stat label="Done" value={String(counts.done)} tone="tone-success" />
      </div>

      <div className="row mt-4" style={{ justifyContent: "space-between", gap: 8 }}>
        <div className="chip-row" style={{ flex: 1 }}>
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
            className="icon-btn muted"
            aria-label="Add homework"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {teacher && showForm && (
        <form className="card card-pad mt-3 space-y" onSubmit={onCreate}>
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Post homework to class
          </p>
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
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Homework title"
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
          <p className="text-11 muted" style={{ margin: 0 }}>
            Shows as: <strong>{formatDueLabel(dueDate)}</strong> ({dueDate})
          </p>
          <button type="submit" className="btn-primary">
            Post homework
          </button>
        </form>
      )}

      <ul className="feed mt-4">
        {filtered.map((it) => {
          const overdue = isDueOverdue(it.dueDate, it.status);
          return (
          <li key={it.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div className="row" style={{ gap: "0.5rem" }}>
              <span className={subjectColor[it.subject] || "pill pill-info"}>
                {it.subject}
              </span>
              <span className={priorityClass[it.priority]}>
                {it.priority[0].toUpperCase() + it.priority.slice(1)}
              </span>
              <span
                className={`text-11 ${overdue ? "tone-destructive font-semibold" : "muted"}`}
                style={{
                  marginLeft: "auto",
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
            <p className="font-medium text-15 mt-2">{it.title}</p>
            <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
              Submit by{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {it.dueDate
                  ? new Date(it.dueDate + "T12:00:00").toLocaleDateString(
                      undefined,
                      { day: "numeric", month: "short", year: "numeric" },
                    )
                  : it.due}
              </strong>
              {" · "}Posted by {it.postedBy} · Class {it.className}
            </p>
            <div className="row mt-2" style={{ justifyContent: "space-between" }}>
              <div className="row text-xs muted" style={{ gap: "0.75rem" }}>
                {it.attachments > 0 && (
                  <span className="row" style={{ gap: 4 }}>
                    <Paperclip size={14} /> {it.attachments}
                  </span>
                )}
                <StatusPill status={it.status} />
              </div>
              <button
                type="button"
                className="text-xs font-semibold tone-primary"
                onClick={() => cycleStatus(it.id, it.status)}
              >
                {teacher ? "Update status" : "Mark progress"}
              </button>
            </div>
          </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="muted text-sm" style={{ justifyContent: "center" }}>
            No homework in this filter.
          </li>
        )}
      </ul>
    </PhoneShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div>
      <p className={`font-bold ${tone}`} style={{ fontSize: "1.5rem", margin: 0 }}>
        {value}
      </p>
      <p className="text-11 muted mt-1">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "submitted" || status === "reviewed") {
    return (
      <span className="row tone-success font-medium" style={{ gap: 4 }}>
        <CheckCircle2 size={14} /> {status === "reviewed" ? "Reviewed" : "Submitted"}
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="row tone-info font-medium" style={{ gap: 4 }}>
        <Clock size={14} /> In progress
      </span>
    );
  }
  return (
    <span className="row tone-warning font-medium" style={{ gap: 4 }}>
      <AlertTriangle size={14} /> Pending
    </span>
  );
}
