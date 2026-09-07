"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type LinkRow = {
  id: string;
  parentUserId: string;
  studentUserId: string;
  parentName?: string;
  studentName?: string;
  relationship: string;
  status: string;
};

export default function ErpLinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    parentUserId: "",
    studentUserId: "",
    relationship: "guardian",
  });

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ links: LinkRow[] }>(
        `/api/erp/links?schoolId=${user.schoolId}`,
      );
      setLinks(res.links || []);
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
    await apiFetch("/api/erp/links", {
      method: "POST",
      body: JSON.stringify({ ...form, schoolId: user.schoolId }),
    });
    setForm({ parentUserId: "", studentUserId: "", relationship: "guardian" });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading links…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Parent ↔ student links</h2>
          <p className="erp-lede">Used by family app for child context</p>
        </div>
      </header>

      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Parent</th>
              <th>Student</th>
              <th>Relationship</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id}>
                <td>{l.parentName || l.parentUserId}</td>
                <td>{l.studentName || l.studentUserId}</td>
                <td>{l.relationship}</td>
                <td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="erp-panel erp-form mt-4" onSubmit={(e) => void create(e)}>
        <h3 className="erp-h2">Link users</h3>
        <label className="erp-label">
          Parent user id
          <input
            className="erp-input"
            value={form.parentUserId}
            onChange={(e) =>
              setForm((f) => ({ ...f, parentUserId: e.target.value }))
            }
            required
          />
        </label>
        <label className="erp-label">
          Student user id
          <input
            className="erp-input"
            value={form.studentUserId}
            onChange={(e) =>
              setForm((f) => ({ ...f, studentUserId: e.target.value }))
            }
            required
          />
        </label>
        <button type="submit" className="erp-btn primary">
          Create link
        </button>
      </form>
    </div>
  );
}
