"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { FeeStructureDto, FeeInvoiceDto } from "@schoolconnect/shared";
import { formatInrPaise } from "@schoolconnect/shared";

export default function ErpFeesPage() {
  const { user } = useAuth();
  const [structures, setStructures] = useState<FeeStructureDto[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "Term 2 tuition",
    academicYear: "2025-26",
    className: "6-B",
    termLabel: "Term 2",
    amount: "4000",
  });

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        structures: FeeStructureDto[];
        invoices: FeeInvoiceDto[];
      }>(`/api/erp/fees?schoolId=${user.schoolId}`);
      setStructures(res.structures || []);
      setInvoices(res.invoices || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function createStructure(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.schoolId) return;
    const amountPaise = Math.round(Number(form.amount) * 100);
    await apiFetch("/api/erp/fees", {
      method: "POST",
      body: JSON.stringify({
        action: "createStructure",
        schoolId: user.schoolId,
        name: form.name,
        academicYear: form.academicYear,
        className: form.className,
        termLabel: form.termLabel,
        heads: [
          { key: "tuition", label: "Tuition", amountPaise },
        ],
      }),
    });
    await load();
  }

  async function generate(structureId: string, className: string) {
    await apiFetch("/api/erp/fees", {
      method: "POST",
      body: JSON.stringify({
        action: "generateInvoices",
        feeStructureId: structureId,
        className,
        dueDate: "2026-06-28",
      }),
    });
    await load();
  }

  async function markPaid(invoiceId: string) {
    await apiFetch("/api/erp/fees", {
      method: "POST",
      body: JSON.stringify({ action: "markPaid", invoiceId }),
    });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading fees…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Fees</h2>
          <p className="erp-lede">
            Structures &amp; invoices sync outstanding balances to family Fees
            tab
          </p>
        </div>
      </header>

      <form className="erp-panel erp-form" onSubmit={(e) => void createStructure(e)}>
        <h3 className="erp-h2">New fee structure</h3>
        <div className="erp-form-grid">
          {(
            [
              ["name", "Name"],
              ["academicYear", "Year"],
              ["className", "Class"],
              ["termLabel", "Term"],
              ["amount", "Amount (INR)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="erp-label">
              {label}
              <input
                className="erp-input"
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                required
              />
            </label>
          ))}
        </div>
        <button type="submit" className="erp-btn primary">
          Create structure
        </button>
      </form>

      <section className="erp-panel mt-4">
        <h3 className="erp-h2">Structures</h3>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {structures.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.className || "All"}</td>
                <td>{formatInrPaise(s.totalPaise)}</td>
                <td>
                  <button
                    type="button"
                    className="erp-btn"
                    onClick={() => void generate(s.id, s.className || "")}
                  >
                    Generate invoices
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="erp-panel mt-4">
        <h3 className="erp-h2">Invoices</h3>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Student profile</th>
              <th>Term</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.studentProfileId.slice(-6)}</td>
                <td>{inv.termLabel}</td>
                <td>{formatInrPaise(inv.totalPaise)}</td>
                <td>{formatInrPaise(inv.paidPaise)}</td>
                <td>{inv.status}</td>
                <td>
                  {inv.status !== "paid" ? (
                    <button
                      type="button"
                      className="erp-btn primary"
                      onClick={() => void markPaid(inv.id)}
                    >
                      Mark paid
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
