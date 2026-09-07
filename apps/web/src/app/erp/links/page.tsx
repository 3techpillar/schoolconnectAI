"use client";

import { useEffect, useMemo, useState } from "react";
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

type DirUser = {
  id: string;
  name: string;
  role: string;
  identifier: string;
  className?: string;
};

export default function ErpLinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [directory, setDirectory] = useState<DirUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [form, setForm] = useState({
    parentUserId: "",
    studentUserId: "",
    relationship: "guardian",
  });

  const parents = useMemo(
    () => directory.filter((u) => u.role === "parent"),
    [directory],
  );
  const students = useMemo(
    () => directory.filter((u) => u.role === "student"),
    [directory],
  );

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const [linkRes, usersRes] = await Promise.all([
        apiFetch<{ links: LinkRow[] }>(
          `/api/erp/links?schoolId=${user.schoolId}`,
        ),
        apiFetch<{ users: DirUser[] }>("/api/users").catch(() => ({
          users: [] as DirUser[],
        })),
      ]);
      setLinks(linkRes.links || []);
      setDirectory(usersRes.users || []);
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
    if (!user?.schoolId || !form.parentUserId || !form.studentUserId) return;
    setFlash(null);
    try {
      await apiFetch("/api/erp/links", {
        method: "POST",
        body: JSON.stringify({ ...form, schoolId: user.schoolId }),
      });
      setForm({
        parentUserId: "",
        studentUserId: "",
        relationship: "guardian",
      });
      setFlash("Link created");
      await load();
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Failed");
    }
  }

  if (loading) return <LoadingBlock label="Loading links…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Parent ↔ student links</h2>
          <p className="erp-lede">
            Family app child context · parents can also self-link on Profile
          </p>
        </div>
      </header>

      {flash ? <p className="erp-flash">{flash}</p> : null}

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
            {links.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No links yet — create below or ask parent to link on Profile.
                </td>
              </tr>
            ) : (
              links.map((l) => (
                <tr key={l.id}>
                  <td>{l.parentName || l.parentUserId}</td>
                  <td>{l.studentName || l.studentUserId}</td>
                  <td>{l.relationship}</td>
                  <td>{l.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form className="erp-panel erp-form mt-4" onSubmit={(e) => void create(e)}>
        <h3 className="erp-h2">Link users</h3>
        <label className="erp-label">
          Parent
          <select
            className="erp-input"
            value={form.parentUserId}
            onChange={(e) =>
              setForm((f) => ({ ...f, parentUserId: e.target.value }))
            }
            required
          >
            <option value="">Select parent…</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.identifier}
              </option>
            ))}
          </select>
        </label>
        <label className="erp-label">
          Student
          <select
            className="erp-input"
            value={form.studentUserId}
            onChange={(e) =>
              setForm((f) => ({ ...f, studentUserId: e.target.value }))
            }
            required
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.className ? ` · ${s.className}` : ""} · {s.identifier}
              </option>
            ))}
          </select>
        </label>
        <label className="erp-label">
          Relationship
          <select
            className="erp-input"
            value={form.relationship}
            onChange={(e) =>
              setForm((f) => ({ ...f, relationship: e.target.value }))
            }
          >
            <option value="guardian">Guardian</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="other">Other</option>
          </select>
        </label>
        <button type="submit" className="erp-btn primary">
          Create link
        </button>
      </form>
    </div>
  );
}
