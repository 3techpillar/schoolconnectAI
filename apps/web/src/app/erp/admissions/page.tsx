"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { AdmissionApplicationDto } from "@schoolconnect/shared";

type Enroll = {
  id: string;
  studentName: string;
  className: string;
  status: string;
  identifier?: string;
};

export default function ErpAdmissionsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AdmissionApplicationDto[]>(
    [],
  );
  const [enrollments, setEnrollments] = useState<Enroll[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        applications: AdmissionApplicationDto[];
        enrollments: Enroll[];
      }>(`/api/erp/admissions?schoolId=${user.schoolId}`);
      setApplications(res.applications || []);
      setEnrollments(res.enrollments || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function patchApp(id: string, status: string) {
    await apiFetch("/api/erp/admissions", {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function patchEnrollment(id: string, status: "approved" | "rejected") {
    await apiFetch(`/api/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function toggleDoc(
    app: AdmissionApplicationDto,
    docKey: string,
  ) {
    const documents = (app.documents || []).map((d) =>
      d.key === docKey
        ? {
            ...d,
            status:
              d.status === "received"
                ? ("pending" as const)
                : ("received" as const),
          }
        : d,
    );
    await apiFetch("/api/erp/admissions", {
      method: "PATCH",
      body: JSON.stringify({ id: app.id, documents }),
    });
    await load();
  }

  if (loading) return <LoadingBlock label="Loading admissions…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Admissions &amp; enrollment</h2>
          <p className="erp-lede">
            Same pipeline feeds family app pending gate and ClassDesk roster
          </p>
        </div>
      </header>

      <section className="erp-panel">
        <h3 className="erp-h2">Enrollment queue</h3>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>ID</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td>{e.studentName}</td>
                <td>{e.className}</td>
                <td>{e.identifier || "—"}</td>
                <td>{e.status}</td>
                <td className="erp-actions">
                  {e.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="erp-btn primary"
                        onClick={() => void patchEnrollment(e.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="erp-btn ghost"
                        onClick={() => void patchEnrollment(e.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="erp-panel mt-4">
        <h3 className="erp-h2">Admission applications</h3>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Status</th>
              <th>Docs checklist</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{a.studentName}</td>
                <td>{a.applyingClassName}</td>
                <td>{a.status}</td>
                <td>
                  <div className="erp-actions">
                    {(a.documents || []).map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        className={`erp-btn ${d.status === "received" ? "primary" : "ghost"}`}
                        title="Toggle received"
                        onClick={() => void toggleDoc(a, d.key)}
                      >
                        {d.label}: {d.status}
                      </button>
                    ))}
                    {(a.documents || []).length === 0 ? "—" : null}
                  </div>
                </td>
                <td className="erp-actions">
                  {a.status !== "enrolled" && a.status !== "rejected" ? (
                    <>
                      <button
                        type="button"
                        className="erp-btn"
                        onClick={() => void patchApp(a.id, "under_review")}
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        className="erp-btn"
                        onClick={() =>
                          void apiFetch("/api/erp/admissions", {
                            method: "PATCH",
                            body: JSON.stringify({
                              id: a.id,
                              status: "interview_scheduled",
                              interviewAt: new Date().toISOString().slice(0, 10),
                            }),
                          }).then(() => load())
                        }
                      >
                        Interview
                      </button>
                      <button
                        type="button"
                        className="erp-btn primary"
                        onClick={() => void patchApp(a.id, "enrolled")}
                      >
                        Enroll
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
