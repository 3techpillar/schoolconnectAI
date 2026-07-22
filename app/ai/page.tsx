"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { ArrowLeft, Mic, Send, Sparkles } from "@/components/Icons";

const suggestions = [
  "How is Aarav doing this week?",
  "Any pending homework?",
  "When is the next PTM?",
  "Show fee status",
];

export default function AIPage() {
  return (
    <PhoneShell
      subtitle="Always-on"
      title="SchoolConnect AI"
      rightSlot={
        <Link href="/" className="icon-btn on-primary" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
      }
    >
      <div className="space-y" style={{ marginBottom: "5rem" }}>
        <Bubble role="ai">
          <p className="text-sm" style={{ margin: 0 }}>
            Hi Priya 👋 I&apos;m your school assistant. Ask me anything about
            Aarav&apos;s school life.
          </p>
        </Bubble>
        <Bubble role="user">
          <p className="text-sm" style={{ margin: 0 }}>
            How is Aarav doing this week?
          </p>
        </Bubble>
        <Bubble role="ai">
          <p className="text-sm" style={{ margin: 0 }}>
            Here&apos;s a quick snapshot for this week:
          </p>
          <div className="metrics-3">
            <MiniMetric label="Attend." value="100%" tone="tone-success" />
            <MiniMetric label="HW done" value="4/5" tone="tone-info" />
            <MiniMetric label="Tests" value="A" tone="tone-secondary" />
          </div>
          <p className="text-xs muted mt-2" style={{ marginBottom: 0 }}>
            Math homework due tomorrow is still pending.
          </p>
        </Bubble>

        <div className="suggestions">
          {suggestions.map((s) => (
            <button key={s} className="chip">
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="composer">
        <div className="composer-inner">
          <Sparkles size={16} className="tone-primary" />
          <input placeholder="Ask anything…" />
          <button className="icon-btn muted" aria-label="Voice" style={{ width: 36, height: 36 }}>
            <Mic size={16} />
          </button>
          <button className="send-btn" aria-label="Send">
            <Send size={16} />
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "ai" | "user";
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="bubble-user">
        <div className="bubble-user-inner">{children}</div>
      </div>
    );
  }
  return (
    <div className="bubble-ai">
      <div className="bubble-ai-avatar">
        <Sparkles size={14} />
      </div>
      <div className="bubble-ai-inner">{children}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="metric">
      <p className={`font-bold ${tone}`} style={{ margin: 0, fontSize: "1rem" }}>
        {value}
      </p>
      <p className="text-10 muted" style={{ margin: 0 }}>
        {label}
      </p>
    </div>
  );
}
