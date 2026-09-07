"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import { ErpCsvImportExport } from "@/components/erp/ErpCsvImportExport";
import type { StaffProfileDto } from "@schoolconnect/shared";

const STAFF_TEMPLATE = [
  "employeeId,name,designation,subjects,phone,email,status",
  "EMP-101,Ms. Kapoor,Class Teacher,Math|Science,9876500001,kapoor@school.demo,active",
  "EMP-102,Mr. Singh,Subject Teacher,English|Hindi,9876500002,singh@school.demo,active",
].join("\n");

export default function ErpStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffProfileDto[]>([]);
  const [directory, setDirectory] = useState<
    Array<{ id: string; name: string; role: string; identifier: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    designation: "Class Teacher",
    subjects: "Math",
  });
  const [csvText, setCsvText] = useState("");
  const [csvFlash, setCsvFlash] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        staff: StaffProfileDto[];
        directory: typeof directory;
      }>(`/api/erp/staff?schoolId=${user.schoolId}`);
      setStaff(res.staff || []);
      setDirectory(res.directory || []);
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
    await apiFetch("/api/erp/staff", {
      method: "POST",
      body: JSON.stringify({
        schoolId: user.schoolId,
        name: form.name,
        employeeId: form.employeeId || undefined,
        designation: form.designation,
        subjects: form.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setForm({
      name: "",
      employeeId: "",
      designation: "Class Teacher",
      subjects: "Math",
    });
    await load();
  }

  async function importCsv() {
    if (!user?.schoolId || !csvText.trim()) return;
    setImporting(true);
    setCsvFlash(null);
    try {
      const res = await apiFetch<{ imported: number; errors?: string[] }>(
        "/api/erp/staff/csv",
        {
          method: "POST",
          body: JSON.stringify({ schoolId: user.schoolId, csv: csvText }),
        },
      );
      setCsvFlash(
        `Imported ${res.imported} staff row(s)` +
          (res.errors?.length ? ` · ${res.errors.length} warning(s)` : ""),
      );
      setCsvText("");
      await load();
    } catch (err) {
      setCsvFlash(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function exportCsv() {
    if (!user?.schoolId) return;
    const res = await fetch(`/api/erp/staff/csv?schoolId=${user.schoolId}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setCsvFlash("Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-${user.schoolId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvFlash("Export downloaded");
  }

  if (loading) return <LoadingBlock label="Loading staff…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Staff / Teachers</h2>
          <p className="erp-lede">
            Staff profiles + login directory · CSV import/export
          </p>
        </div>
        <div className="erp-actions">
          <button type="button" className="erp-btn ghost" onClick={() => void exportCsv()}>
            Export CSV
          </button>
        </div>
      </header>

      <div className="erp-split">
        <div className="erp-panel">
          <h3 className="erp-h2">Staff profiles</h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Emp#</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Subjects</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.employeeId || "—"}</td>
                  <td>{s.name}</td>
                  <td>{s.designation}</td>
                  <td>{s.subjects.join(", ")}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="erp-panel">
          <h3 className="erp-h2">App directory</h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Login</th>
              </tr>
            </thead>
            <tbody>
              {directory.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.role}</td>
                  <td>{d.identifier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form className="erp-panel erp-form mt-4" onSubmit={(e) => void create(e)}>
        <h3 className="erp-h2">Add staff profile</h3>
        <div className="erp-form-grid">
          {(
            [
              ["name", "Name"],
              ["employeeId", "Employee ID"],
              ["designation", "Designation"],
              ["subjects", "Subjects (comma)"],
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
        </div>
        <button type="submit" className="erp-btn primary">
          Create
        </button>
      </form>

      <ErpCsvImportExport
        kind="staff"
        csvText={csvText}
        onCsvTextChange={setCsvText}
        onImport={importCsv}
        onExport={exportCsv}
        templateCsv={STAFF_TEMPLATE}
        templateFilename="staff-teachers-template.csv"
        flash={csvFlash}
        importing={importing}
      />
    </div>
  );
}
