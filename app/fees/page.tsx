"use client";

import { PhoneShell } from "@/components/PhoneShell";
import { Download, CheckCircle2, AlertCircle } from "@/components/Icons";

export default function FeesPage() {
  return (
    <PhoneShell subtitle="Term 2 · 2025-26" title="Fees">
      <section className="fees-hero">
        <p className="text-xs" style={{ opacity: 0.7, margin: 0 }}>
          Outstanding amount
        </p>
        <p
          className="font-semibold"
          style={{ fontSize: "2.25rem", margin: "0.25rem 0 0", letterSpacing: "-0.02em" }}
        >
          ₹4,200
        </p>
        <p
          className="text-xs row mt-2"
          style={{ opacity: 0.8, gap: 4 }}
        >
          <AlertCircle size={14} /> Due 28 Jun 2026
        </p>
        <button className="btn-white">Pay now</button>
      </section>

      <div className="stats-grid mt-4">
        <MiniCard label="Paid this year" value="₹38,800" tone="tone-success" />
        <MiniCard label="Total annual" value="₹43,000" tone="" />
      </div>

      <h2 className="section-label">Payment history</h2>
      <ul className="feed">
        {[
          { title: "Term 1 fees", date: "12 Apr 2026", amount: "₹15,200" },
          { title: "Bus fee — Q1", date: "12 Apr 2026", amount: "₹6,500" },
          { title: "Admission fee", date: "20 Mar 2026", amount: "₹17,100" },
        ].map((p, i) => (
          <li key={i}>
            <CheckCircle2 size={18} className="tone-success" />
            <div className="grow">
              <p className="font-medium text-sm truncate">{p.title}</p>
              <p className="text-11 muted">{p.date}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="font-semibold text-sm" style={{ margin: 0 }}>
                {p.amount}
              </p>
              <button
                className="text-11 tone-primary font-medium row"
                style={{ gap: 2, marginLeft: "auto" }}
              >
                <Download size={12} /> Receipt
              </button>
            </div>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}

function MiniCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <p className="text-11 muted" style={{ margin: 0 }}>
        {label}
      </p>
      <p
        className={`font-semibold ${tone}`}
        style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
    </div>
  );
}
