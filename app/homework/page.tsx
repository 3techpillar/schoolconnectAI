"use client";

import { PhoneShell } from "@/components/PhoneShell";
import {
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "@/components/Icons";

const items = [
  {
    subject: "Math",
    color: "pill pill-info",
    title: "Exercise 4.2 — Fractions",
    due: "Tomorrow",
    priority: "high",
    attachments: 1,
    status: "pending",
  },
  {
    subject: "Science",
    color: "pill pill-success",
    title: "Plant cell diagram",
    due: "Fri, 28 Jun",
    priority: "medium",
    attachments: 2,
    status: "in-progress",
  },
  {
    subject: "English",
    color: "pill pill-secondary",
    title: "Read Chapter 7 & answer Qs",
    due: "Mon, 1 Jul",
    priority: "low",
    attachments: 0,
    status: "pending",
  },
  {
    subject: "Hindi",
    color: "pill pill-warning",
    title: "निबंध — मेरा विद्यालय",
    due: "Yesterday",
    priority: "high",
    attachments: 0,
    status: "submitted",
  },
];

const priorityClass: Record<string, string> = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

export default function HomeworkPage() {
  return (
    <PhoneShell subtitle="3 active · 1 submitted" title="Homework">
      <div className="card card-pad summary-3">
        <Stat label="Pending" value="2" tone="tone-warning" />
        <Stat label="In progress" value="1" tone="tone-info" />
        <Stat label="Done" value="1" tone="tone-success" />
      </div>

      <div className="chip-row mt-5">
        {["All", "Math", "Science", "English", "Hindi"].map((t, i) => (
          <button key={t} className={`chip ${i === 0 ? "active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      <ul className="feed mt-4">
        {items.map((it, i) => (
          <li key={i} style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div className="row" style={{ gap: "0.5rem" }}>
              <span className={it.color}>{it.subject}</span>
              <span className={priorityClass[it.priority]}>
                {it.priority[0].toUpperCase() + it.priority.slice(1)}
              </span>
              <span
                className="text-11 muted"
                style={{ marginLeft: "auto", display: "inline-flex", gap: 4, alignItems: "center" }}
              >
                <Clock size={12} /> {it.due}
              </span>
            </div>
            <p className="font-medium text-15 mt-2">{it.title}</p>
            <div className="row mt-2" style={{ justifyContent: "space-between" }}>
              <div className="row text-xs muted" style={{ gap: "0.75rem" }}>
                {it.attachments > 0 && (
                  <span className="row" style={{ gap: 4 }}>
                    <Paperclip size={14} /> {it.attachments}
                  </span>
                )}
                <StatusPill status={it.status} />
              </div>
              <button className="text-xs font-semibold tone-primary">Open</button>
            </div>
          </li>
        ))}
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
  if (status === "submitted") {
    return (
      <span className="row tone-success font-medium" style={{ gap: 4 }}>
        <CheckCircle2 size={14} /> Submitted
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
