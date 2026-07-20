import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/homework")({
  head: () => ({ meta: [{ title: "Homework — SchoolConnect AI" }] }),
  component: HomeworkPage,
});

const items = [
  { subject: "Math", color: "bg-info text-info-foreground", title: "Exercise 4.2 — Fractions", due: "Tomorrow", priority: "high", attachments: 1, status: "pending" },
  { subject: "Science", color: "bg-success text-success-foreground", title: "Plant cell diagram", due: "Fri, 28 Jun", priority: "medium", attachments: 2, status: "in-progress" },
  { subject: "English", color: "bg-secondary text-secondary-foreground", title: "Read Chapter 7 & answer Qs", due: "Mon, 1 Jul", priority: "low", attachments: 0, status: "pending" },
  { subject: "Hindi", color: "bg-warning text-warning-foreground", title: "निबंध — मेरा विद्यालय", due: "Yesterday", priority: "high", attachments: 0, status: "submitted" },
];

const priorityMap: Record<string, { label: string; tone: string }> = {
  high: { label: "High", tone: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", tone: "bg-warning/10 text-warning" },
  low: { label: "Low", tone: "bg-muted text-muted-foreground" },
};

export default function HomeworkPage() {
  return (
    <PhoneShell subtitle="3 active · 1 submitted" title="Homework">
      <div className="rounded-2xl bg-surface border border-border p-4 grid grid-cols-3 text-center divide-x divide-border">
        <Stat label="Pending" value="2" tone="text-warning" />
        <Stat label="In progress" value="1" tone="text-info" />
        <Stat label="Done" value="1" tone="text-success" />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {["All", "Math", "Science", "English", "Hindi"].map((t, i) => (
          <button key={t} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${i === 0 ? "bg-primary text-white border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      <ul className="mt-4 rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
        {items.map((it, i) => (
          <li key={i} className="p-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${it.color}`}>{it.subject}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityMap[it.priority].tone}`}>{priorityMap[it.priority].label}</span>
              <span className="ml-auto text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {it.due}
              </span>
            </div>
            <p className="mt-2.5 font-medium text-[15px] leading-snug">{it.title}</p>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {it.attachments > 0 && (
                  <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {it.attachments}</span>
                )}
                <StatusPill status={it.status} />
              </div>
              <button className="text-xs font-semibold text-primary">Open</button>
            </div>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "submitted") return <span className="inline-flex items-center gap-1 text-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Submitted</span>;
  if (status === "in-progress") return <span className="inline-flex items-center gap-1 text-info font-medium"><Clock className="h-3.5 w-3.5" /> In progress</span>;
  return <span className="inline-flex items-center gap-1 text-warning font-medium"><AlertTriangle className="h-3.5 w-3.5" /> Pending</span>;
}
