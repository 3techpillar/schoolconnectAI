"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Session = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function ErpSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [label, setLabel] = useState("2026-27");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ sessions: Session[] }>(
        `/api/erp/sessions?schoolId=${user.schoolId}`,
      );
      setSessions(res.sessions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.schoolId) return;
    await apiFetch("/api/erp/sessions", {
      method: "POST",
      body: JSON.stringify({
        action: "create",
        schoolId: user.schoolId,
        label,
      }),
    });
    await load();
  }

  async function act(sessionId: string, action: "activate" | "complete") {
    if (!user?.schoolId) return;
    await apiFetch("/api/erp/sessions", {
      method: "POST",
      body: JSON.stringify({ action, schoolId: user.schoolId, sessionId }),
    });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading sessions…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Academic sessions</h2>
          <p className="erp-lede">Activate year for school MDM &amp; apps</p>
        </div>
      </header>

      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.label}</td>
                <td>{s.status}</td>
                <td className="erp-actions">
                  {s.status !== "active" ? (
                    <button
                      type="button"
                      className="erp-btn primary"
                      onClick={() => void act(s.id, "activate")}
                    >
                      Activate
                    </button>
                  ) : null}
                  {s.status === "active" ? (
                    <button
                      type="button"
                      className="erp-btn ghost"
                      onClick={() => void act(s.id, "complete")}
                    >
                      Complete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="erp-panel erp-form mt-4" onSubmit={(e) => void create(e)}>
        <h3 className="erp-h2">New session</h3>
        <label className="erp-label">
          Label
          <input
            className="erp-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="erp-btn primary">
          Create
        </button>
      </form>
    </div>
  );
}
