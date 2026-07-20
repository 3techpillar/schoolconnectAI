import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mic, Send, Sparkles } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Assistant — SchoolConnect AI" }] }),
  component: AIPage,
});

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
        <Link to="/" className="grid place-items-center h-10 w-10 rounded-full bg-primary-foreground/15 backdrop-blur text-primary-foreground hover:bg-primary-foreground/25 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      }
    >
      <div className="space-y-3">
        <Bubble role="ai">
          <p className="text-sm">Hi Priya 👋 I'm your school assistant. Ask me anything about Aarav's school life.</p>
        </Bubble>
        <Bubble role="user">
          <p className="text-sm">How is Aarav doing this week?</p>
        </Bubble>
        <Bubble role="ai">
          <p className="text-sm">Here's a quick snapshot for this week:</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <MiniMetric label="Attend." value="100%" tone="text-success" />
            <MiniMetric label="HW done" value="4/5" tone="text-info" />
            <MiniMetric label="Tests" value="A" tone="text-secondary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Math homework due tomorrow is still pending.</p>
        </Bubble>

        <div className="flex flex-wrap gap-2 pt-1">
          {suggestions.map((s) => (
            <button key={s} className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-surface text-foreground hover:bg-accent transition">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="fixed bottom-20 inset-x-0 z-30 mx-auto max-w-md px-4">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-2xl shadow-card pl-4 pr-2 py-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <input
            placeholder="Ask anything…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <button className="grid place-items-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground" aria-label="Voice">
            <Mic className="h-4 w-4" />
          </button>
          <button className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-white shadow-pop" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

function Bubble({ role, children }: { role: "ai" | "user"; children: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-primary text-white px-4 py-2.5 shadow-pop">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-primary grid place-items-center text-white">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface border border-border px-4 py-2.5 shadow-soft">{children}</div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-2 text-center">
      <p className={`text-base font-bold ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
