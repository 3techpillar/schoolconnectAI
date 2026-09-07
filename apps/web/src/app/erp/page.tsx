"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Dash = {
  summary: {
    students: number;
    classes: number;
    staff: number;
    pendingEnrollments: number;
    pendingLeaves: number;
    openInvoices: number;
    presentToday: number;
    leaveToday: number;
    markedToday: number;
    month: string;
  };
  usersByRole: Record<string, number>;
  recentLeaves: Array<{
    id: string;
    studentName: string;
    status: string;
    fromDate: string;
    toDate: string;
  }>;
};

export default function ErpDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.schoolId && user?.role !== "super_admin") return;
    const q = user.schoolId ? `?schoolId=${user.schoolId}` : "";
    void apiFetch<Dash>(`/api/erp/dashboard${q}`)
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [user]);

  if (err) return <p className="erp-error">{err}</p>;
  if (!data) return <LoadingBlock label="Loading dashboard…" />;

  const s = data.summary;
  const cards = [
    { label: "Students", value: s.students, href: "/erp/students" },
    { label: "Classes", value: s.classes, href: "/erp/classes" },
    { label: "Staff", value: s.staff, href: "/erp/staff" },
    {
      label: "Pending enrollments",
      value: s.pendingEnrollments,
      href: "/erp/admissions",
    },
    { label: "Pending leaves", value: s.pendingLeaves, href: "/erp/leaves" },
    { label: "Open invoices", value: s.openInvoices, href: "/erp/fees" },
    { label: "Present today", value: s.presentToday, href: "/erp/attendance" },
    { label: "On leave today", value: s.leaveToday, href: "/erp/attendance" },
  ];

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">School operations</h2>
          <p className="erp-lede">
            Master data for web &amp; mobile — month {s.month}
          </p>
        </div>
      </header>

      <div className="erp-stat-grid">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="erp-stat-card">
            <span className="erp-stat-value">{c.value}</span>
            <span className="erp-stat-label">{c.label}</span>
          </Link>
        ))}
      </div>

      <section className="erp-panel mt-6">
        <h3 className="erp-h2">Users by role</h3>
        <div className="erp-chip-row">
          {Object.entries(data.usersByRole).map(([role, n]) => (
            <span key={role} className="erp-chip">
              {role}: {n}
            </span>
          ))}
        </div>
      </section>

      <section className="erp-panel mt-4">
        <h3 className="erp-h2">Recent leaves</h3>
        {data.recentLeaves.length === 0 ? (
          <p className="text-sm muted">No leave requests yet.</p>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Dates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeaves.map((l) => (
                <tr key={l.id}>
                  <td>{l.studentName}</td>
                  <td>
                    {l.fromDate} → {l.toDate}
                  </td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
