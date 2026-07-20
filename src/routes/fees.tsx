import { createFileRoute } from "@tanstack/react-router";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/fees")({
  head: () => ({ meta: [{ title: "Fees — SchoolConnect AI" }] }),
  component: FeesPage,
});

export default function FeesPage() {
  return (
    <PhoneShell subtitle="Term 2 · 2025-26" title="Fees">
      <section className="rounded-2xl bg-primary text-white p-5">
        <p className="text-xs text-white/70">Outstanding amount</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">₹4,200</p>
        <p className="mt-1.5 text-xs text-white/80 inline-flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" /> Due 28 Jun 2026
        </p>
        <button className="mt-4 w-full bg-white text-primary font-semibold rounded-xl py-3 hover:bg-white/95 transition">
          Pay now
        </button>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniCard label="Paid this year" value="₹38,800" tone="text-success" />
        <MiniCard label="Total annual" value="₹43,000" tone="text-foreground" />
      </div>

      <h2 className="mt-6 mb-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Payment history</h2>
      <ul className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
        {[
          { title: "Term 1 fees", date: "12 Apr 2026", amount: "₹15,200" },
          { title: "Bus fee — Q1", date: "12 Apr 2026", amount: "₹6,500" },
          { title: "Admission fee", date: "20 Mar 2026", amount: "₹17,100" },
        ].map((p, i) => (
          <li key={i} className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-[18px] w-[18px] text-success shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{p.title}</p>
              <p className="text-[11px] text-muted-foreground">{p.date}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">{p.amount}</p>
              <button className="text-[11px] text-primary font-medium inline-flex items-center gap-0.5">
                <Download className="h-3 w-3" /> Receipt
              </button>
            </div>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}

function MiniCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}
