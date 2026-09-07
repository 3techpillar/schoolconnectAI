"use client";

import { useRef, useState, type ReactNode } from "react";

type Props = {
  kind: "students" | "staff";
  csvText: string;
  onCsvTextChange: (v: string) => void;
  onImport: () => Promise<void>;
  onExport: () => Promise<void>;
  templateCsv: string;
  templateFilename: string;
  flash?: string | null;
  importing?: boolean;
};

const STUDENT_GUIDE = {
  title: "Students CSV — guidelines",
  required: ["name"],
  recommended: ["admissionNo", "className", "rollNo", "guardianName", "guardianPhone"],
  notes: [
    "First row must be the header exactly as in the template (column names are case-sensitive).",
    "UTF-8 CSV. Open in Excel/Google Sheets → Save as CSV.",
    "className format like 6-B (grade-section). Creates/updates ClassDesk roster on import.",
    "admissionNo: if provided and already exists for this school, profile is updated (upsert).",
    "status on export may show enrolled/alumni/…; import sets enrolled.",
    "dob use YYYY-MM-DD. gender: male | female | other | leave blank.",
    "Max 500 rows per import. Fields with commas must be quoted.",
    "Does not create login users — only StudentProfile MDM. Link parents separately.",
  ],
};

const STAFF_GUIDE = {
  title: "Teachers / staff CSV — guidelines",
  required: ["name"],
  recommended: ["employeeId", "designation", "subjects", "phone", "email"],
  notes: [
    "First row must match the template header.",
    "subjects: use pipe | between subjects (e.g. Math|Science) — not commas.",
    "employeeId: if present and matches an existing staff row, that row is updated.",
    "designation examples: Class Teacher, Subject Teacher, Principal, Accountant.",
    "status: active | inactive (default active).",
    "Import creates StaffProfile MDM only — it does not create app login accounts. Teachers still sign up via invite code or admin user tools.",
    "Max 500 rows per import.",
  ],
};

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ErpCsvImportExport({
  kind,
  csvText,
  onCsvTextChange,
  onImport,
  onExport,
  templateCsv,
  templateFilename,
  flash,
  importing,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localFlash, setLocalFlash] = useState<string | null>(null);
  const guide = kind === "students" ? STUDENT_GUIDE : STAFF_GUIDE;

  async function handleFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    onCsvTextChange(text);
    setLocalFlash(`Loaded ${file.name} (${text.split(/\r?\n/).length} lines)`);
  }

  return (
    <section className="erp-panel mt-4">
      <div className="erp-page-head" style={{ marginBottom: "0.75rem" }}>
        <div>
          <h3 className="erp-h2">{guide.title}</h3>
          <p className="erp-lede" style={{ margin: 0 }}>
            Import / export school {kind === "students" ? "students" : "teachers & staff"}{" "}
            via CSV
          </p>
        </div>
        <div className="erp-actions">
          <button
            type="button"
            className="erp-btn ghost"
            onClick={() => downloadText(templateFilename, templateCsv)}
          >
            Download template
          </button>
          <button type="button" className="erp-btn ghost" onClick={() => void onExport()}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="erp-form-grid" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="text-11 muted" style={{ margin: "0 0 0.35rem" }}>
            Required columns
          </p>
          <p className="text-sm" style={{ margin: 0 }}>
            {guide.required.map((c) => (
              <code key={c} style={{ marginRight: 6 }}>
                {c}
              </code>
            ))}
          </p>
        </div>
        <div>
          <p className="text-11 muted" style={{ margin: "0 0 0.35rem" }}>
            Recommended
          </p>
          <p className="text-sm" style={{ margin: 0 }}>
            {guide.recommended.map((c) => (
              <code key={c} style={{ marginRight: 6 }}>
                {c}
              </code>
            ))}
          </p>
        </div>
      </div>

      <details className="mb-3">
        <summary className="text-sm font-semibold" style={{ cursor: "pointer" }}>
          Full guidelines
        </summary>
        <ul className="admin-bullets" style={{ marginTop: "0.5rem" }}>
          {guide.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="text-11 muted">
          Also see docs: <code>docs/DATA-IMPORT-EXPORT.md</code>
        </p>
      </details>

      <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => void handleFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          className="erp-btn"
          onClick={() => fileRef.current?.click()}
        >
          Choose CSV file
        </button>
        <button
          type="button"
          className="erp-btn primary"
          disabled={importing || !csvText.trim()}
          onClick={() => void onImport()}
        >
          {importing ? "Importing…" : "Import CSV"}
        </button>
      </div>

      {(flash || localFlash) && (
        <p className="erp-flash">{flash || localFlash}</p>
      )}

      <label className="erp-label">
        CSV text (paste or load file)
        <textarea
          className="erp-input"
          rows={8}
          style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
          placeholder="Paste CSV here…"
          value={csvText}
          onChange={(e) => onCsvTextChange(e.target.value)}
        />
      </label>
    </section>
  );
}

export function CsvGuideCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="erp-panel">
      <h3 className="erp-h2">{title}</h3>
      {children}
    </div>
  );
}
