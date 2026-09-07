"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Subject = {
  id: string;
  code: string;
  name: string;
  className: string;
  teacherName: string;
  mandatory: boolean;
  active: boolean;
};

export default function ErpSubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    name: "",
    className: "6-B",
    teacherName: "",
  });

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ subjects: Subject[] }>(
        `/api/erp/subjects?schoolId=${user.schoolId}`,
      );
      setSubjects(res.subjects || []);
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
    await apiFetch("/api/erp/subjects", {
      method: "POST",
      body: JSON.stringify({ ...form, schoolId: user.schoolId }),
    });
    setForm({ code: "", name: "", className: "6-B", teacherName: "" });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading subjects…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Subjects</h2>
          <p className="erp-lede">Subject master by class (BRD Academic module)</p>
        </div>
      </header>

      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Class</th>
              <th>Teacher</th>
              <th>Mandatory</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td>{s.code}</td>
                <td>{s.name}</td>
                <td>{s.className || "All"}</td>
                <td>{s.teacherName || "—"}</td>
                <td>{s.mandatory ? "Yes" : "Optional"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="erp-panel erp-form mt-4" onSubmit={(e) => void create(e)}>
        <h3 className="erp-h2">Add subject</h3>
        <div className="erp-form-grid">
          {(
            [
              ["code", "Code"],
              ["name", "Name"],
              ["className", "Class"],
              ["teacherName", "Teacher"],
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
                required={key === "code" || key === "name"}
              />
            </label>
          ))}
        </div>
        <button type="submit" className="erp-btn primary">
          Create
        </button>
      </form>
    </div>
  );
}
