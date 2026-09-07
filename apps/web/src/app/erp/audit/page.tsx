"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Log = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: number;
};

export default function ErpAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId && user?.role !== "super_admin") return;
    const q = user.schoolId ? `?schoolId=${user.schoolId}` : "";
    setLoading(true);
    void apiFetch<{ logs: Log[] }>(`/api/erp/audit${q}`)
      .then((r) => setLogs(r.logs || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingBlock label="Loading audit…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Audit log</h2>
          <p className="erp-lede">Recent ERP mutations</p>
        </div>
      </header>
      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.actorName}</td>
                <td>{l.action}</td>
                <td>{l.entityType}</td>
                <td>{l.entityId || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
