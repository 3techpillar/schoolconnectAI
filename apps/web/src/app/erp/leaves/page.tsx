"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type LeaveRow = {
  id: string;
  studentName: string;
  className?: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  applicantName: string;
};

export default function ErpLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ leaves: LeaveRow[] }>(
        `/api/erp/leaves?schoolId=${user.schoolId}`,
      );
      setLeaves(res.leaves || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function decide(id: string, status: "approved" | "rejected") {
    await apiFetch("/api/erp/leaves", {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading leaves…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Leaves</h2>
          <p className="erp-lede">
            Approve writes L to ClassDesk; reject clears auto L marks
          </p>
        </div>
      </header>

      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>By</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id}>
                <td>{l.studentName}</td>
                <td>{l.className || "—"}</td>
                <td>
                  {l.fromDate} → {l.toDate}
                </td>
                <td>{l.reason}</td>
                <td>{l.applicantName}</td>
                <td>{l.status}</td>
                <td className="erp-actions">
                  {l.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="erp-btn primary"
                        onClick={() => void decide(l.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="erp-btn ghost"
                        onClick={() => void decide(l.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
