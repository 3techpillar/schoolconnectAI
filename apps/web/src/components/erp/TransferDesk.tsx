"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth, isSchoolAdmin, isSuperAdmin } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { SchoolDto } from "@schoolconnect/shared";

type TransferDto = {
  id: string;
  studentUserId: string;
  studentName: string;
  fromSchoolId: string;
  toSchoolId: string;
  groupCode: string;
  fromClassName: string;
  toClassName: string;
  reason: string;
  status: string;
  requestedByName: string;
  reviewedByName?: string;
  createdAt: number;
};

type DirectoryUser = {
  id: string;
  name: string;
  role: string;
  schoolId?: string;
  className?: string;
};

/** Shared transfer desk — Connect `/transfers` + ERP `/erp/transfers`. */
export function TransferDesk({ embedded }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferDto[]>([]);
  const [destinations, setDestinations] = useState<SchoolDto[]>([]);
  const [schoolNames, setSchoolNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [students, setStudents] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentUserId: "",
    toSchoolId: "",
    toClassName: "6-B",
    reason: "Campus transfer",
  });

  const schoolName = useMemo(() => {
    return (id: string) => schoolNames.get(id) || id.slice(0, 8);
  }, [schoolNames]);

  async function load() {
    setLoading(true);
    try {
      const q = user?.schoolId ? `?schoolId=${user.schoolId}` : "";
      const [t, u] = await Promise.all([
        apiFetch<{ transfers: TransferDto[]; destinations?: SchoolDto[] }>(
          `/api/erp/transfers${q}`,
        ),
        apiFetch<{ users: DirectoryUser[] }>("/api/users").catch(() => ({
          users: [] as DirectoryUser[],
        })),
      ]);
      setTransfers(t.transfers || []);
      const dest = t.destinations || [];
      setDestinations(dest);
      const map = new Map<string, string>();
      for (const s of dest) map.set(s.id, s.name);
      if (user?.schoolId && user.school) {
        map.set(user.schoolId, user.school);
      }
      setSchoolNames(map);
      setStudents(
        (u.users || []).filter(
          (x) =>
            x.role === "student" &&
            (!user?.schoolId || x.schoolId === user.schoolId),
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function createTransfer(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/api/erp/transfers", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setFlash("Transfer request sent to destination campus");
    await load();
  }

  async function review(id: string, status: "approved" | "rejected") {
    await apiFetch("/api/erp/transfers", {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    });
    setFlash(status === "approved" ? "Transfer approved" : "Transfer rejected");
    await load();
  }

  if (loading) return <LoadingBlock label="Loading transfers…" />;

  const body = (
    <>
      {flash ? <p className="erp-flash">{flash}</p> : null}
      <p className="text-sm muted" style={{ marginTop: 0 }}>
        Same <code>groupCode</code> = group transfer. Cross-group when
        destination has <code>transferPolicy: open</code>. Connect + ERP.
      </p>

      <div className={embedded ? "card card-pad" : "erp-panel"}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>From</th>
              <th>To</th>
              <th>Class</th>
              <th>Status</th>
              <th>By</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => {
              const canReview =
                t.status === "pending" &&
                (isSuperAdmin(user) ||
                  (isSchoolAdmin(user) && user?.schoolId === t.toSchoolId));
              return (
                <tr key={t.id}>
                  <td>{t.studentName}</td>
                  <td>{schoolName(t.fromSchoolId)}</td>
                  <td>{schoolName(t.toSchoolId)}</td>
                  <td>
                    {t.fromClassName || "—"} → {t.toClassName || "—"}
                  </td>
                  <td>{t.status}</td>
                  <td>{t.requestedByName}</td>
                  <td>
                    {canReview ? (
                      <span className="row" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="erp-btn primary"
                          onClick={() => void review(t.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="erp-btn ghost"
                          onClick={() => void review(t.id, "rejected")}
                        >
                          Reject
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!transfers.length ? (
              <tr>
                <td colSpan={7} className="muted">
                  No transfers yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {(isSchoolAdmin(user) || isSuperAdmin(user)) && destinations.length > 0 ? (
        <form
          className={embedded ? "card card-pad mt-3" : "erp-panel mt-4 erp-form"}
          onSubmit={(e) => void createTransfer(e)}
        >
          <h3 className={embedded ? "font-semibold text-sm" : "erp-h2"}>
            Request transfer (outbound)
          </h3>
          <div className="erp-form-grid">
            <label className="erp-label">
              Student
              <select
                className="erp-input"
                required
                value={form.studentUserId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, studentUserId: e.target.value }))
                }
              >
                <option value="">Select…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className || "—"})
                  </option>
                ))}
              </select>
            </label>
            <label className="erp-label">
              Destination
              <select
                className="erp-input"
                required
                value={form.toSchoolId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, toSchoolId: e.target.value }))
                }
              >
                <option value="">Select…</option>
                {destinations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.transferPolicy === "open" ? " (open)" : ""}
                    {s.groupCode ? ` · ${s.groupCode}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="erp-label">
              Target class
              <input
                className="erp-input"
                value={form.toClassName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, toClassName: e.target.value }))
                }
              />
            </label>
            <label className="erp-label">
              Reason
              <input
                className="erp-input"
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </label>
          </div>
          <button type="submit" className="erp-btn primary">
            Send request
          </button>
        </form>
      ) : null}
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Campus transfers</h2>
          <p className="erp-lede">
            Group (same code) or cross-group (destination open)
          </p>
        </div>
      </header>
      {body}
    </div>
  );
}
