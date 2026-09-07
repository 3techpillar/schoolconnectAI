"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Report = {
  school: { name: string; city?: string };
  exam: { name: string; academicYear: string; className: string };
  student: { name: string; rollNo?: string; admissionNo?: string; className?: string };
  marks: Array<{
    subjectName: string;
    maxMarks: number;
    marksObtained: number;
    grade: string;
    remarks?: string;
  }>;
  summary: {
    totalMax: number;
    totalGot: number;
    percentage: number;
    result: string;
  };
};

function ReportCardInner() {
  const { user } = useAuth();
  const params = useSearchParams();
  const examId = params.get("examId") || "";
  const studentProfileId = params.get("studentProfileId") || "";
  const [data, setData] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.schoolId || !examId || !studentProfileId) return;
    void apiFetch<Report>(
      `/api/erp/id-cards?kind=report&schoolId=${user.schoolId}&examId=${examId}&studentProfileId=${studentProfileId}`,
    )
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [user?.schoolId, examId, studentProfileId]);

  if (err) return <p className="erp-error">{err}</p>;
  if (!examId || !studentProfileId) {
    return (
      <p className="text-sm muted">
        Open from Exams → Card link, or pass examId &amp; studentProfileId.
      </p>
    );
  }
  if (!data) return <LoadingBlock label="Loading report card…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Report card</h2>
          <p className="erp-lede">
            {data.exam.name} · {data.exam.academicYear}
          </p>
        </div>
        <button
          type="button"
          className="erp-btn primary"
          onClick={() => window.print()}
        >
          Print / PDF
        </button>
      </header>

      <article className="erp-panel report-card">
        <h3 style={{ marginTop: 0 }}>{data.school.name}</h3>
        <p className="text-sm muted">{data.school.city}</p>
        <p>
          <strong>{data.student.name}</strong> · Class{" "}
          {data.student.className || data.exam.className} · Roll{" "}
          {data.student.rollNo || "—"} · Adm {data.student.admissionNo || "—"}
        </p>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Max</th>
              <th>Obtained</th>
              <th>Grade</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.marks.map((m, i) => (
              <tr key={`${m.subjectName}-${i}`}>
                <td>{m.subjectName}</td>
                <td>{m.maxMarks}</td>
                <td>{m.marksObtained}</td>
                <td>{m.grade}</td>
                <td>{m.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16 }}>
          Total: {data.summary.totalGot}/{data.summary.totalMax} (
          {data.summary.percentage}%) · <strong>{data.summary.result}</strong>
        </p>
        <div className="erp-form-grid" style={{ marginTop: 24 }}>
          <p className="text-11 muted">Class teacher remarks: _______________</p>
          <p className="text-11 muted">Principal: _______________</p>
        </div>
      </article>
    </div>
  );
}

export default function ErpReportCardsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <ReportCardInner />
    </Suspense>
  );
}
