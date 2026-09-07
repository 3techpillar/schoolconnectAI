"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth, isSuperAdmin } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { ProductMode, SchoolDto } from "@schoolconnect/shared";

const emptyForm = {
  name: "",
  code: "",
  city: "",
  board: "",
  phone: "",
  email: "",
  productMode: "connect" as ProductMode,
};

export default function ErpSchoolsPage() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    try {
      const q = user?.schoolId ? `?schoolId=${user.schoolId}` : "";
      const res = await apiFetch<{ schools: SchoolDto[] }>(`/api/erp/schools${q}`);
      setSchools(res.schools || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/api/erp/schools", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setFlash("School created");
    setForm(emptyForm);
    await load();
  }

  async function toggleStatus(s: SchoolDto) {
    await apiFetch("/api/erp/schools", {
      method: "PATCH",
      body: JSON.stringify({
        id: s.id,
        status: s.status === "active" ? "paused" : "active",
      }),
    });
    await load();
  }

  async function setProductMode(s: SchoolDto, productMode: ProductMode) {
    await apiFetch("/api/erp/schools", {
      method: "PATCH",
      body: JSON.stringify({ id: s.id, productMode }),
    });
    setFlash(`${s.name} → ${productMode}`);
    await load();
  }

  async function setTransferPolicy(
    s: SchoolDto,
    transferPolicy: "group_only" | "open",
  ) {
    await apiFetch("/api/erp/schools", {
      method: "PATCH",
      body: JSON.stringify({ id: s.id, transferPolicy }),
    });
    await load();
  }

  async function setExpiry(s: SchoolDto, isoDate: string) {
    if (!isoDate) return;
    await apiFetch("/api/erp/schools", {
      method: "PATCH",
      body: JSON.stringify({
        id: s.id,
        subscriptionExpiresAt: new Date(isoDate).toISOString(),
      }),
    });
    setFlash(`Expiry updated for ${s.name}`);
    await load();
  }

  function expiryInputValue(s: SchoolDto) {
    if (!s.subscriptionExpiresAt) return "";
    return new Date(s.subscriptionExpiresAt).toISOString().slice(0, 10);
  }

  if (loading) return <LoadingBlock label="Loading schools…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Schools</h2>
          <p className="erp-lede">
            Tenant MDM — product mode Connect (collab) or Full ERP
          </p>
        </div>
      </header>
      {flash ? <p className="erp-flash">{flash}</p> : null}

      <div className="erp-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>City</th>
              <th>Board</th>
              <th>Mode</th>
              <th>Group</th>
              <th>Transfer</th>
              <th>Sub ends</th>
              <th>Year</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.code || "—"}</td>
                <td>{s.city || "—"}</td>
                <td>{s.board || "—"}</td>
                <td>
                  {isSuperAdmin(user) ? (
                    <select
                      className="erp-input"
                      style={{ minWidth: "7rem" }}
                      value={s.productMode || "connect"}
                      onChange={(e) =>
                        void setProductMode(
                          s,
                          e.target.value as ProductMode,
                        )
                      }
                    >
                      <option value="connect">Connect</option>
                      <option value="erp">Full ERP</option>
                    </select>
                  ) : (
                    s.productMode || "connect"
                  )}
                </td>
                <td>{s.groupCode || "—"}</td>
                <td>
                  {isSuperAdmin(user) ? (
                    <select
                      className="erp-input"
                      style={{ minWidth: "7rem" }}
                      value={s.transferPolicy || "group_only"}
                      onChange={(e) =>
                        void setTransferPolicy(
                          s,
                          e.target.value as "group_only" | "open",
                        )
                      }
                    >
                      <option value="group_only">Group only</option>
                      <option value="open">Open intake</option>
                    </select>
                  ) : (
                    s.transferPolicy || "group_only"
                  )}
                </td>
                <td>
                  {isSuperAdmin(user) ? (
                    <input
                      type="date"
                      className="erp-input"
                      value={expiryInputValue(s)}
                      onChange={(e) => void setExpiry(s, e.target.value)}
                      title={
                        s.subscriptionActive === false
                          ? "Expired"
                          : "Free/paid end date"
                      }
                    />
                  ) : s.subscriptionExpiresAt ? (
                    new Date(s.subscriptionExpiresAt).toLocaleDateString()
                  ) : (
                    "—"
                  )}
                  {s.subscriptionActive === false ? (
                    <span className="muted"> · expired</span>
                  ) : null}
                </td>
                <td>{s.academicYearCurrent || "—"}</td>
                <td>{s.status}</td>
                <td>
                  <button
                    type="button"
                    className="erp-btn ghost"
                    onClick={() => void toggleStatus(s)}
                  >
                    {s.status === "active" ? "Pause" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSuperAdmin(user) ? (
        <form className="erp-panel mt-4 erp-form" onSubmit={(e) => void createSchool(e)}>
          <h3 className="erp-h2">Create school</h3>
          <div className="erp-form-grid">
            {(
              [
                ["name", "Name"],
                ["code", "Code"],
                ["city", "City"],
                ["board", "Board"],
                ["phone", "Phone"],
                ["email", "Email"],
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
            <label className="erp-label">
              Product mode
              <select
                className="erp-input"
                value={form.productMode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productMode: e.target.value as ProductMode,
                  }))
                }
              >
                <option value="connect">Connect (chats, bus, leave)</option>
                <option value="erp">Full ERP (SIS, fees, exams)</option>
              </select>
            </label>
          </div>
          <button type="submit" className="erp-btn primary">
            Create
          </button>
        </form>
      ) : null}
    </div>
  );
}
