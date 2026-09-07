"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { ClassSectionDto } from "@schoolconnect/shared";

export default function ErpClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    grade: "6",
    section: "B",
    capacity: "40",
  });

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ classes: ClassSectionDto[] }>(
        `/api/erp/classes?schoolId=${user.schoolId}`,
      );
      setClasses(res.classes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.schoolId) return;
    await apiFetch("/api/erp/classes", {
      method: "POST",
      body: JSON.stringify({
        schoolId: user.schoolId,
        grade: form.grade,
        section: form.section,
        capacity: Number(form.capacity) || 40,
      }),
    });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading classes…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Classes &amp; sections</h2>
          <p className="erp-lede">Grade / section capacity and teacher assignment</p>
        </div>
      </header>

      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Capacity</th>
              <th>Teacher</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>{c.className}</td>
                <td>{c.grade}</td>
                <td>{c.section}</td>
                <td>{c.capacity ?? 40}</td>
                <td>{c.classTeacherId || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="erp-panel erp-form mt-4" onSubmit={(e) => void createClass(e)}>
        <h3 className="erp-h2">Add class</h3>
        <div className="erp-form-grid">
          <label className="erp-label">
            Grade
            <input
              className="erp-input"
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              required
            />
          </label>
          <label className="erp-label">
            Section
            <input
              className="erp-input"
              value={form.section}
              onChange={(e) =>
                setForm((f) => ({ ...f, section: e.target.value }))
              }
              required
            />
          </label>
          <label className="erp-label">
            Capacity
            <input
              className="erp-input"
              value={form.capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacity: e.target.value }))
              }
            />
          </label>
        </div>
        <button type="submit" className="erp-btn primary">
          Create
        </button>
      </form>
    </div>
  );
}
