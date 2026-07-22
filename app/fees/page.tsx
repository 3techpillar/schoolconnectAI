"use client";

import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
} from "@/components/Icons";

const DUE_DATE = "28 Jun 2026";
const OUTSTANDING = "₹4,200";
const BASE_AMOUNT = "₹4,000";
const LATE_PENALTY = "₹200";
const IS_OVERDUE = true; // demo: past due → show penalty hint

export default function FeesPage() {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <PhoneShell subtitle="Term 2 · 2025-26" title="Fees">
      <section className="fees-due-card">
        <div className="fees-due-main">
          <p className="fees-due-label">Outstanding amount</p>
          <div className="fees-due-row">
            <p className="fees-due-amount">{OUTSTANDING}</p>
            <button type="button" className="fees-pay-btn">
              Pay now
            </button>
          </div>
          <div className="fees-due-meta">
            <span className={`fees-deadline ${IS_OVERDUE ? "late" : ""}`}>
              <AlertCircle size={12} />
              {IS_OVERDUE ? "Overdue · " : "Due "}
              {DUE_DATE}
            </span>
            {IS_OVERDUE && (
              <span className="fees-tip-wrap">
                <button
                  type="button"
                  className="fees-tip-btn"
                  aria-label="Late payment penalty info"
                  onClick={() => setTipOpen((v) => !v)}
                  onBlur={() => setTipOpen(false)}
                >
                  <Info size={13} />
                  Penalty
                </button>
                <span
                  className={`fees-tooltip ${tipOpen ? "is-open" : ""}`}
                  role="tooltip"
                >
                  Late payment: base {BASE_AMOUNT} + penalty {LATE_PENALTY}.
                  Total due {OUTSTANDING}.
                </span>
              </span>
            )}
          </div>
        </div>
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
    <div className="card" style={{ padding: "0.85rem" }}>
      <p className="text-11 muted" style={{ margin: 0 }}>
        {label}
      </p>
      <p
        className={`font-semibold ${tone}`}
        style={{
          margin: "0.2rem 0 0",
          fontSize: "1.15rem",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
    </div>
  );
}
