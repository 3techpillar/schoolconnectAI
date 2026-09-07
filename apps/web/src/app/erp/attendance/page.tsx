"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Report = {
  month: string;
  summary: {
    pending: number;
    approvedMonth: number;
    rejectedMonth: number;
    leaveMarksMonth: number;
  };
  classes: Array<{
    className: string;
    rosterCount: number;
    presentToday: number;
    leaveToday: number;
    markedToday: number;
    leaveMarksMonth: number;
  }>;
};

export default function ErpAttendancePage() {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void apiFetch<Report>("/api/attendance/report")
      .then(setReport)
      .finally(() => setLoading(false));
  }, [user]);

  async function exportCsv() {
    if (!user?.schoolId) return;
    const res = await fetch(
      `/api/erp/attendance/csv?schoolId=${user.schoolId}`,
      { credentials: "include" },
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingBlock label="Loading attendance…" />;
  if (!report) return <p className="erp-error">Could not load report.</p>;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Attendance</h2>
          <p className="erp-lede">
            School-wide view from ClassDesk (teacher marks + approved leave L)
          </p>
        </div>
        <div className="erp-actions">
          <button type="button" className="erp-btn ghost" onClick={() => void exportCsv()}>
            Export today CSV
          </button>
        </div>
      </header>

      <div className="erp-stat-grid">
        <div className="erp-stat-card">
          <span className="erp-stat-value">{report.summary.pending}</span>
          <span className="erp-stat-label">Pending leaves</span>
        </div>
        <div className="erp-stat-card">
          <span className="erp-stat-value">{report.summary.approvedMonth}</span>
          <span className="erp-stat-label">Approved ({report.month})</span>
        </div>
        <div className="erp-stat-card">
          <span className="erp-stat-value">{report.summary.leaveMarksMonth}</span>
          <span className="erp-stat-label">L marks this month</span>
        </div>
      </div>

      <section className="erp-panel mt-4">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Roster</th>
              <th>Marked today</th>
              <th>Present</th>
              <th>Leave today</th>
              <th>L month</th>
            </tr>
          </thead>
          <tbody>
            {report.classes.map((c) => (
              <tr key={c.className}>
                <td>{c.className}</td>
                <td>{c.rosterCount}</td>
                <td>{c.markedToday}</td>
                <td>{c.presentToday}</td>
                <td>{c.leaveToday}</td>
                <td>{c.leaveMarksMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
