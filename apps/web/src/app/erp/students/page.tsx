"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { StudentProfileDto } from "@schoolconnect/shared";

export default function ErpStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfileDto[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    admissionNo: "",
    className: "6-B",
    rollNo: "",
    guardianName: "",
    guardianPhone: "",
  });
  const [csvText, setCsvText] = useState("");

  async function load(search = q) {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ schoolId: user.schoolId });
      if (search) params.set("q", search);
      const res = await apiFetch<{ students: StudentProfileDto[] }>(
        `/api/erp/students?${params}`,
      );
      setStudents(res.students || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.schoolId) return;
    await apiFetch("/api/erp/students", {
      method: "POST",
      body: JSON.stringify({
        schoolId: user.schoolId,
        name: form.name,
        admissionNo: form.admissionNo || undefined,
        className: form.className,
        rollNo: form.rollNo,
        status: "enrolled",
        guardians: form.guardianName
          ? [
              {
                name: form.guardianName,
                phone: form.guardianPhone,
                isPrimary: true,
                relationship: "guardian",
              },
            ]
          : [],
      }),
    });
    setForm({
      name: "",
      admissionNo: "",
      className: "6-B",
      rollNo: "",
      guardianName: "",
      guardianPhone: "",
    });
    await load();
  }

  async function saveSelected() {
    if (!selected) return;
    await apiFetch("/api/erp/students", {
      method: "PATCH",
      body: JSON.stringify(selected),
    });
    await load();
  }

  async function importCsv() {
    if (!user?.schoolId || !csvText.trim()) return;
    await apiFetch("/api/erp/students/csv", {
      method: "POST",
      body: JSON.stringify({ schoolId: user.schoolId, csv: csvText }),
    });
    setCsvText("");
    await load();
  }

  async function exportCsv() {
    if (!user?.schoolId) return;
    const res = await fetch(
      `/api/erp/students/csv?schoolId=${user.schoolId}`,
      { credentials: "include" },
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${user.schoolId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Students</h2>
          <p className="erp-lede">
            Student master (MDM) — ClassDesk roster syncs from here
          </p>
        </div>
        <div className="erp-actions">
          <button type="button" className="erp-btn ghost" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </header>

      <div className="erp-toolbar">
        <input
          className="erp-input"
          placeholder="Search name / admission / roll"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load(q);
          }}
        />
        <button type="button" className="erp-btn" onClick={() => void load(q)}>
          Search
        </button>
      </div>

      {loading ? (
        <LoadingBlock label="Loading students…" />
      ) : (
        <div className="erp-split">
          <div className="erp-panel">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Adm#</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Roll</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className={selected?.id === s.id ? "selected" : ""}
                    onClick={() => setSelected(s)}
                  >
                    <td>{s.admissionNo || "—"}</td>
                    <td>{s.name}</td>
                    <td>{s.className || "—"}</td>
                    <td>{s.rollNo || "—"}</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="erp-side">
            {selected ? (
              <div className="erp-panel erp-form">
                <h3 className="erp-h2">Edit student</h3>
                <label className="erp-label">
                  Name
                  <input
                    className="erp-input"
                    value={selected.name}
                    onChange={(e) =>
                      setSelected({ ...selected, name: e.target.value })
                    }
                  />
                </label>
                <label className="erp-label">
                  Admission No
                  <input
                    className="erp-input"
                    value={selected.admissionNo || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, admissionNo: e.target.value })
                    }
                  />
                </label>
                <label className="erp-label">
                  Class
                  <input
                    className="erp-input"
                    value={selected.className || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, className: e.target.value })
                    }
                  />
                </label>
                <label className="erp-label">
                  Roll
                  <input
                    className="erp-input"
                    value={selected.rollNo || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, rollNo: e.target.value })
                    }
                  />
                </label>
                <label className="erp-label">
                  DOB
                  <input
                    className="erp-input"
                    value={selected.dob || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, dob: e.target.value })
                    }
                  />
                </label>
                <label className="erp-label">
                  Address
                  <input
                    className="erp-input"
                    value={selected.address || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, address: e.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="erp-btn primary"
                  onClick={() => void saveSelected()}
                >
                  Save &amp; sync roster
                </button>
              </div>
            ) : (
              <p className="text-sm muted">Select a student to edit.</p>
            )}

            <form
              className="erp-panel erp-form mt-4"
              onSubmit={(e) => void createStudent(e)}
            >
              <h3 className="erp-h2">Add student</h3>
              {(
                [
                  ["name", "Name"],
                  ["admissionNo", "Admission No"],
                  ["className", "Class"],
                  ["rollNo", "Roll"],
                  ["guardianName", "Guardian"],
                  ["guardianPhone", "Guardian phone"],
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
                    required={key === "name"}
                  />
                </label>
              ))}
              <button type="submit" className="erp-btn primary">
                Create
              </button>
            </form>

            <div className="erp-panel erp-form mt-4">
              <h3 className="erp-h2">Import CSV</h3>
              <p className="text-11 muted">
                Header: admissionNo,name,className,rollNo,guardianName,guardianPhone
              </p>
              <textarea
                className="erp-input erp-textarea"
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <button
                type="button"
                className="erp-btn"
                onClick={() => void importCsv()}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
