"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Overview = {
  circulars: Array<{
    id: string;
    className: string;
    title: string;
    tag: string;
    postedBy: string;
    createdAt: number;
    unreadCount: number;
  }>;
  homework: Array<{
    id: string;
    subject: string;
    title: string;
    due: string;
    priority: string;
    status: string;
    className: string;
    postedBy: string;
  }>;
};

export default function ErpOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) return;
    setLoading(true);
    void apiFetch<Overview>(`/api/erp/overview?schoolId=${user.schoolId}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  if (loading) return <LoadingBlock label="Loading overview…" />;
  if (!data) return <p className="erp-error">Could not load overview.</p>;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Circulars &amp; homework</h2>
          <p className="erp-lede">
            Read-only ops view — teachers still publish from the class app
          </p>
        </div>
      </header>

      <div className="erp-split">
        <section className="erp-panel">
          <h3 className="erp-h2">Recent circulars</h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Title</th>
                <th>Tag</th>
                <th>Unread</th>
              </tr>
            </thead>
            <tbody>
              {data.circulars.map((c) => (
                <tr key={`${c.className}-${c.id}`}>
                  <td>{c.className}</td>
                  <td>{c.title}</td>
                  <td>{c.tag}</td>
                  <td>{c.unreadCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.circulars.length === 0 ? (
            <p className="text-sm muted">No circulars yet.</p>
          ) : null}
        </section>

        <section className="erp-panel">
          <h3 className="erp-h2">Homework</h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Title</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.homework.map((h) => (
                <tr key={h.id}>
                  <td>{h.className}</td>
                  <td>{h.subject}</td>
                  <td>{h.title}</td>
                  <td>{h.due}</td>
                  <td>{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.homework.length === 0 ? (
            <p className="text-sm muted">No homework yet.</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
