"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

type Exam = {
  id: string;
  name: string;
  type: string;
  className: string;
  status: string;
  academicYear: string;
  papers: Array<{ subjectName: string; maxMarks: number }>;
};

type Mark = {
  id: string;
  studentProfileId: string;
  studentName: string;
  rollNo: string;
  subjectName: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
};

type Student = { id: string; name: string; rollNo?: string; className?: string };

export default function ErpExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "Unit Test 1",
    type: "unit_test",
    className: "6-B",
    subjectName: "Math",
    maxMarks: "100",
  });
  const [markForm, setMarkForm] = useState({
    studentProfileId: "",
    subjectName: "Math",
    marksObtained: "80",
    maxMarks: "100",
  });

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const [ex, st] = await Promise.all([
        apiFetch<{ exams: Exam[] }>(`/api/erp/exams?schoolId=${user.schoolId}`),
        apiFetch<{ students: Student[] }>(
          `/api/erp/students?schoolId=${user.schoolId}&status=enrolled`,
        ),
      ]);
      setExams(ex.exams || []);
      setStudents(st.students || []);
    } finally {
      setLoading(false);
    }
  }

  async function openExam(exam: Exam) {
    setSelected(exam);
    const res = await apiFetch<{ exam: Exam; marks: Mark[] }>(
      `/api/erp/exams?schoolId=${user?.schoolId}&examId=${exam.id}`,
    );
    setSelected(res.exam);
    setMarks(res.marks || []);
    setMarkForm((f) => ({
      ...f,
      subjectName: res.exam.papers?.[0]?.subjectName || f.subjectName,
    }));
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.schoolId) return;
    await apiFetch("/api/erp/exams", {
      method: "POST",
      body: JSON.stringify({
        schoolId: user.schoolId,
        name: form.name,
        type: form.type,
        className: form.className,
        status: "scheduled",
        papers: [
          {
            subjectName: form.subjectName,
            maxMarks: Number(form.maxMarks) || 100,
          },
        ],
      }),
    });
    await load();
  }

  async function saveMark(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !markForm.studentProfileId) return;
    await apiFetch("/api/erp/exams", {
      method: "POST",
      body: JSON.stringify({
        action: "upsertMark",
        examId: selected.id,
        studentProfileId: markForm.studentProfileId,
        subjectName: markForm.subjectName,
        marksObtained: Number(markForm.marksObtained),
        maxMarks: Number(markForm.maxMarks) || 100,
      }),
    });
    await openExam(selected);
  }

  if (loading) return <LoadingBlock label="Loading exams…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Exams &amp; gradebook</h2>
          <p className="erp-lede">
            Setup exams, enter marks, open printable report cards
          </p>
        </div>
      </header>

      <div className="erp-split">
        <div className="erp-panel">
          <h3 className="erp-h2">Exams</h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex) => (
                <tr
                  key={ex.id}
                  className={selected?.id === ex.id ? "selected" : ""}
                  onClick={() => void openExam(ex)}
                >
                  <td>{ex.name}</td>
                  <td>{ex.className || "—"}</td>
                  <td>{ex.type}</td>
                  <td>{ex.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="erp-panel erp-form" onSubmit={(e) => void createExam(e)}>
          <h3 className="erp-h2">Create exam</h3>
          {(
            [
              ["name", "Name"],
              ["type", "Type"],
              ["className", "Class"],
              ["subjectName", "Subject"],
              ["maxMarks", "Max marks"],
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
                required
              />
            </label>
          ))}
          <button type="submit" className="erp-btn primary">
            Create
          </button>
        </form>
      </div>

      {selected ? (
        <section className="erp-panel mt-4">
          <h3 className="erp-h2">
            Marks · {selected.name}
          </h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.id}>
                  <td>{m.studentName}</td>
                  <td>{m.rollNo}</td>
                  <td>{m.subjectName}</td>
                  <td>
                    {m.marksObtained}/{m.maxMarks}
                  </td>
                  <td>{m.grade}</td>
                  <td>
                    <Link
                      className="erp-btn ghost"
                      href={`/erp/report-cards?examId=${selected.id}&studentProfileId=${m.studentProfileId}`}
                    >
                      Card
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="erp-form mt-4" onSubmit={(e) => void saveMark(e)}>
            <h3 className="erp-h2">Enter marks</h3>
            <div className="erp-form-grid">
              <label className="erp-label">
                Student
                <select
                  className="erp-input"
                  value={markForm.studentProfileId}
                  onChange={(e) =>
                    setMarkForm((f) => ({
                      ...f,
                      studentProfileId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select…</option>
                  {students
                    .filter(
                      (s) =>
                        !selected.className ||
                        s.className === selected.className,
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.rollNo ? `${s.rollNo}. ` : ""}
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="erp-label">
                Subject
                <input
                  className="erp-input"
                  value={markForm.subjectName}
                  onChange={(e) =>
                    setMarkForm((f) => ({ ...f, subjectName: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="erp-label">
                Marks
                <input
                  className="erp-input"
                  value={markForm.marksObtained}
                  onChange={(e) =>
                    setMarkForm((f) => ({
                      ...f,
                      marksObtained: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="erp-label">
                Max
                <input
                  className="erp-input"
                  value={markForm.maxMarks}
                  onChange={(e) =>
                    setMarkForm((f) => ({ ...f, maxMarks: e.target.value }))
                  }
                />
              </label>
            </div>
            <button type="submit" className="erp-btn primary">
              Save mark
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
