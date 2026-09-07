"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Exam = {
  id: string;
  name: string;
  className: string;
  academicYear: string;
  status: string;
};

type Student = {
  id: string;
  name: string;
  rollNo?: string;
  className?: string;
};

type Report = {
  school: { name: string; city?: string };
  exam: { name: string; academicYear: string; className: string };
  student: {
    name: string;
    rollNo?: string;
    admissionNo?: string;
    className?: string;
  };
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
  const router = useRouter();
  const params = useSearchParams();
  const examId = params.get("examId") || "";
  const studentProfileId = params.get("studentProfileId") || "";

  const [data, setData] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [picker, setPicker] = useState({ examId: "", studentProfileId: "" });
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    if (!user?.schoolId) return;
    if (examId && studentProfileId) return;
    setLoadingLists(true);
    void Promise.all([
      apiFetch<{ exams: Exam[] }>(`/api/erp/exams?schoolId=${user.schoolId}`),
      apiFetch<{ students: Student[] }>(
        `/api/erp/students?schoolId=${user.schoolId}&status=enrolled`,
      ),
    ])
      .then(([ex, st]) => {
        setExams(ex.exams || []);
        setStudents(st.students || []);
        setPicker((p) => ({
          examId: p.examId || ex.exams?.[0]?.id || "",
          studentProfileId: p.studentProfileId || st.students?.[0]?.id || "",
        }));
      })
      .finally(() => setLoadingLists(false));
  }, [user?.schoolId, examId, studentProfileId]);

  useEffect(() => {
    if (!user?.schoolId || !examId || !studentProfileId) return;
    setErr(null);
    setData(null);
    void apiFetch<Report>(
      `/api/erp/id-cards?kind=report&schoolId=${user.schoolId}&examId=${examId}&studentProfileId=${studentProfileId}`,
    )
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [user?.schoolId, examId, studentProfileId]);

  if (!examId || !studentProfileId) {
    return (
      <div className="erp-page">
        <header className="erp-page-head">
          <div>
            <h2 className="erp-h1">Report cards</h2>
            <p className="erp-lede">
              Pick an exam and student, or open from Exams → Card
            </p>
          </div>
          <Link href="/erp/exams" className="erp-btn">
            Exams desk
          </Link>
        </header>

        {loadingLists ? (
          <LoadingBlock label="Loading exams…" />
        ) : (
          <form
            className="erp-panel erp-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!picker.examId || !picker.studentProfileId) return;
              router.push(
                `/erp/report-cards?examId=${picker.examId}&studentProfileId=${picker.studentProfileId}`,
              );
            }}
          >
            <label className="erp-label">
              Exam
              <select
                className="erp-input"
                value={picker.examId}
                onChange={(e) =>
                  setPicker((p) => ({ ...p, examId: e.target.value }))
                }
                required
              >
                <option value="">Select exam…</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} · {ex.className} · {ex.academicYear}
                  </option>
                ))}
              </select>
            </label>
            <label className="erp-label">
              Student
              <select
                className="erp-input"
                value={picker.studentProfileId}
                onChange={(e) =>
                  setPicker((p) => ({
                    ...p,
                    studentProfileId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.className ? ` · ${s.className}` : ""}
                    {s.rollNo ? ` · Roll ${s.rollNo}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="erp-btn primary">
              Open report card
            </button>
            {exams.length === 0 ? (
              <p className="text-11 muted" style={{ marginBottom: 0 }}>
                No exams yet — create one under{" "}
                <Link href="/erp/exams">Exams</Link>.
              </p>
            ) : null}
          </form>
        )}
      </div>
    );
  }

  if (err) {
    return (
      <div className="erp-page">
        <p className="erp-error">{err}</p>
        <Link href="/erp/report-cards" className="erp-btn mt-3">
          Back to picker
        </Link>
      </div>
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
        <div className="erp-actions">
          <Link href="/erp/report-cards" className="erp-btn">
            Change
          </Link>
          <button
            type="button"
            className="erp-btn primary"
            onClick={() => window.print()}
          >
            Print / PDF
          </button>
        </div>
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
