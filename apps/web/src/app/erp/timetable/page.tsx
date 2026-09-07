"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";
import type { ClassSectionDto } from "@schoolconnect/shared";

const DAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

export default function ErpTimetablePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSectionDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => classes.find((c) => c.id === selectedId) || null,
    [classes, selectedId],
  );

  async function load() {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ classes: ClassSectionDto[] }>(
        `/api/erp/classes?schoolId=${user.schoolId}`,
      );
      setClasses(res.classes || []);
      if (!selectedId && res.classes?.[0]) setSelectedId(res.classes[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  async function seedDemoPeriods() {
    if (!selected) return;
    setSaving(true);
    try {
      const periods = DAYS.flatMap((day, di) =>
        [1, 2, 3, 4].map((period) => ({
          day,
          period,
          subject: ["Math", "Science", "English", "SST"][(period + di) % 4],
          teacherName: "Ms. Sharma",
          startTime: `${7 + period}:30`,
          endTime: `${8 + period}:10`,
        })),
      );
      await apiFetch("/api/erp/classes", {
        method: "PATCH",
        body: JSON.stringify({
          id: selected.id,
          periods,
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading timetable…" />;

  return (
    <div className="erp-page">
      <header className="erp-page-head">
        <div>
          <h2 className="erp-h1">Timetable</h2>
          <p className="erp-lede">
            Stub periods on ClassSection — apps can consume later read-only
          </p>
        </div>
        <div className="erp-actions">
          <select
            className="erp-input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="erp-btn primary"
            disabled={!selected || saving}
            onClick={() => void seedDemoPeriods()}
          >
            {saving ? "Saving…" : "Seed demo week"}
          </button>
        </div>
      </header>

      <div className="erp-panel">
        {!selected ? (
          <p className="text-sm muted">Select a class.</p>
        ) : (selected.periods || []).length === 0 ? (
          <p className="text-sm muted">
            No periods yet. Use “Seed demo week” to add a stub timetable.
          </p>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {[...(selected.periods || [])]
                .sort((a, b) =>
                  a.day === b.day
                    ? a.period - b.period
                    : DAYS.indexOf(a.day as (typeof DAYS)[number]) -
                      DAYS.indexOf(b.day as (typeof DAYS)[number]),
                )
                .map((p, i) => (
                  <tr key={`${p.day}-${p.period}-${i}`}>
                    <td>{p.day}</td>
                    <td>{p.period}</td>
                    <td>{p.subject}</td>
                    <td>{p.teacherName}</td>
                    <td>
                      {p.startTime}–{p.endTime}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
