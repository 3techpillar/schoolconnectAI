"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { StudentProfileDto, SchoolDto, StaffProfileDto } from "@schoolconnect/shared";

export default function ErpIdCardsPage() {
  const { user } = useAuth();
  const [school, setSchool] = useState<SchoolDto | null>(null);
  const [students, setStudents] = useState<StudentProfileDto[]>([]);
  const [staff, setStaff] = useState<StaffProfileDto[]>([]);
  const [kind, setKind] = useState<"students" | "staff">("students");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) return;
    setLoading(true);
    void apiFetch<{
      school: SchoolDto;
      students?: StudentProfileDto[];
      staff?: StaffProfileDto[];
    }>(`/api/erp/id-cards?schoolId=${user.schoolId}&kind=${kind}`)
      .then((res) => {
        setSchool(res.school);
        setStudents(res.students || []);
        setStaff(res.staff || []);
      })
      .finally(() => setLoading(false));
  }, [user?.schoolId, kind]);

  if (loading) return <LoadingBlock label="Loading ID cards…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">ID cards</h2>
          <p className="erp-lede">Print-ready cards (browser Print → PDF)</p>
        </div>
        <div className="erp-actions">
          <select
            className="erp-input"
            value={kind}
            onChange={(e) => setKind(e.target.value as "students" | "staff")}
          >
            <option value="students">Students</option>
            <option value="staff">Staff</option>
          </select>
          <button
            type="button"
            className="erp-btn primary"
            onClick={() => window.print()}
          >
            Print / PDF
          </button>
        </div>
      </header>

      <div className="id-card-grid">
        {kind === "students"
          ? students.map((s) => {
              const emergency =
                s.guardians?.find((g) => g.isPrimary)?.phone ||
                s.guardians?.[0]?.phone ||
                s.mobile ||
                "—";
              return (
                <article key={s.id} className="id-card">
                  <header className="id-card-head">
                    <strong>{school?.name}</strong>
                    <span>{school?.branchName || school?.city}</span>
                  </header>
                  <div className="id-card-body">
                    <div className="id-card-photo">
                      {(s.firstName || s.name).slice(0, 1)}
                      {(s.lastName || s.name.split(" ").pop() || "").slice(0, 1)}
                    </div>
                    <div>
                      <p className="id-card-name">{s.name}</p>
                      <p>Adm: {s.admissionNo || s.studentId || "—"}</p>
                      <p>
                        {s.className} · Roll {s.rollNo || "—"}
                      </p>
                      <p>Emergency: {emergency}</p>
                    </div>
                  </div>
                  <footer className="id-card-foot">
                    QR · {s.id.slice(-8).toUpperCase()}
                  </footer>
                </article>
              );
            })
          : staff.map((s) => (
              <article key={s.id} className="id-card">
                <header className="id-card-head">
                  <strong>{school?.name}</strong>
                  <span>Staff</span>
                </header>
                <div className="id-card-body">
                  <div className="id-card-photo">{s.name.slice(0, 2)}</div>
                  <div>
                    <p className="id-card-name">{s.name}</p>
                    <p>Emp: {s.employeeId || "—"}</p>
                    <p>{s.designation || "Staff"}</p>
                    <p>{(s.subjects || []).join(", ") || "—"}</p>
                  </div>
                </div>
                <footer className="id-card-foot">
                  QR · {s.id.slice(-8).toUpperCase()}
                </footer>
              </article>
            ))}
      </div>
    </div>
  );
}
