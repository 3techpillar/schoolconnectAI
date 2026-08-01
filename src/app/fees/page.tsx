"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
} from "@/components/Icons";
import { EmptyState, ErrorBanner, LoadingBlock } from "@/components/StatusUI";
import { useAuth } from "@/lib/providers/auth";
import { apiFetch, ApiError } from "@/lib/shared/api-client";

type FeeHistoryItem = { title: string; date: string; amount: string };

type FeesPayload = {
  termLabel: string;
  outstanding: string;
  outstandingPaise?: number;
  baseAmount: string;
  latePenalty: string;
  dueDateLabel: string;
  overdue: boolean;
  paidThisYear: string;
  totalAnnual: string;
  history: FeeHistoryItem[];
};

const OFFLINE_FALLBACK: FeesPayload = {
  termLabel: "Term 2 · 2025-26",
  outstanding: "₹4,200",
  outstandingPaise: 420000,
  baseAmount: "₹4,000",
  latePenalty: "₹200",
  dueDateLabel: "28 Jun 2026",
  overdue: true,
  paidThisYear: "₹38,800",
  totalAnnual: "₹43,000",
  history: [
    { title: "Term 1 fees", date: "12 Apr 2026", amount: "₹15,200" },
    { title: "Bus fee — Q1", date: "12 Apr 2026", amount: "₹6,500" },
    { title: "Admission fee", date: "20 Mar 2026", amount: "₹17,100" },
  ],
};

export default function FeesPage() {
  const { backend, ready: authReady, user } = useAuth();
  const [tipOpen, setTipOpen] = useState(false);
  const [fees, setFees] = useState<FeesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadFees = useCallback(async () => {
    if (backend && user) {
      const res = await apiFetch<{ fees: FeesPayload }>("/api/fees");
      setFees(res.fees);
      setError(null);
      return;
    }
    setFees(OFFLINE_FALLBACK);
  }, [backend, user]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        await loadFees();
      } catch (err) {
        if (!cancelled) {
          setFees(null);
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load fees. Try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, loadFees]);

  const outstandingPaise = fees?.outstandingPaise ?? 0;
  const canPay = Boolean(fees && outstandingPaise > 0 && !paying);

  const onPay = async () => {
    if (!canPay || !backend) {
      if (!backend && fees) {
        setFees({
          ...fees,
          outstanding: "₹0",
          outstandingPaise: 0,
          overdue: false,
          baseAmount: "₹0",
          latePenalty: "₹0",
          paidThisYear: fees.paidThisYear,
          history: [
            {
              title: `${fees.termLabel} payment`,
              date: new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              amount: fees.outstanding,
            },
            ...fees.history,
          ],
        });
        setFlash("Payment recorded (offline demo)");
      }
      return;
    }
    setPaying(true);
    setFlash(null);
    try {
      const res = await apiFetch<{
        fees: FeesPayload;
        alreadyPaid?: boolean;
      }>("/api/fees", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setFees(res.fees);
      setFlash(
        res.alreadyPaid ? "Nothing due — already paid" : "Payment recorded",
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Payment failed. Try again.",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <PhoneShell subtitle={fees?.termLabel || "Fees"} title="Fees">
      {loading ? <LoadingBlock label="Loading fees…" /> : null}
      {error ? (
        <ErrorBanner message={error} onRetry={() => void loadFees()} />
      ) : null}
      {flash ? (
        <p className="text-sm tone-success" style={{ marginBottom: "0.75rem" }}>
          {flash}
        </p>
      ) : null}

      {!loading && !fees && !error ? (
        <EmptyState title="No fee ledger" body="Fees will appear after setup." />
      ) : null}

      {fees ? (
        <>
          <section className="fees-due-card">
            <div className="fees-due-main">
              <p className="fees-due-label">Outstanding amount</p>
              <div className="fees-due-row">
                <p className="fees-due-amount">{fees.outstanding}</p>
                <button
                  type="button"
                  className="fees-pay-btn"
                  disabled={!canPay}
                  onClick={() => void onPay()}
                >
                  {paying
                    ? "Paying…"
                    : outstandingPaise <= 0
                      ? "Paid"
                      : "Pay now"}
                </button>
              </div>
              <div className="fees-due-meta">
                <span className={`fees-deadline ${fees.overdue ? "late" : ""}`}>
                  <AlertCircle size={12} />
                  {outstandingPaise <= 0
                    ? "No dues"
                    : fees.overdue
                      ? `Overdue · ${fees.dueDateLabel}`
                      : `Due ${fees.dueDateLabel}`}
                </span>
                {fees.overdue && outstandingPaise > 0 && (
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
                      Late payment: base {fees.baseAmount} + penalty{" "}
                      {fees.latePenalty}. Total due {fees.outstanding}.
                    </span>
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="stats-grid mt-4">
            <MiniCard
              label="Paid this year"
              value={fees.paidThisYear}
              tone="tone-success"
            />
            <MiniCard label="Total annual" value={fees.totalAnnual} tone="" />
          </div>

          <h2 className="section-label">Payment history</h2>
          <ul className="feed">
            {fees.history.map((p, i) => (
              <li key={`${p.title}-${i}`}>
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
                    type="button"
                  >
                    <Download size={12} /> Receipt
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
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
