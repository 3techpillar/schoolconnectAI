"use client";

import { PhoneShell } from "@/components/PhoneShell";

const startWeekday = 1;
const daysInMonth = 30;

type Status = "P" | "A" | "L" | "H" | null;
const statusMap: Record<number, Status> = {};
[1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 19, 22, 23, 24, 25].forEach(
  (d) => (statusMap[d] = "P"),
);
[6, 13, 20, 27, 7, 14, 21, 28].forEach((d) => (statusMap[d] = null));
statusMap[18] = "A";
statusMap[26] = "L";
statusMap[29] = "H";
statusMap[30] = "P";

export default function AttendancePage() {
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <PhoneShell subtitle="June 2026" title="Attendance">
      <section className="card" style={{ padding: "1.25rem" }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div>
            <p className="text-xs muted">This month</p>
            <p
              className="tone-success font-semibold"
              style={{ fontSize: "2.25rem", margin: "0.25rem 0 0", letterSpacing: "-0.02em" }}
            >
              96%
            </p>
          </div>
          <div
            className="text-xs muted"
            style={{ marginLeft: "auto", textAlign: "right", lineHeight: 1.6 }}
          >
            <p style={{ margin: 0 }}>20 Present</p>
            <p style={{ margin: 0 }}>1 Absent · 1 Leave · 1 Half</p>
          </div>
        </div>
        <div className="progress">
          <span style={{ width: "96%" }} />
        </div>
      </section>

      <section className="card card-pad mt-4">
        <div className="cal-grid text-10 font-semibold muted mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => (
            <div key={i}>
              {d && (
                <div className={`cal-day cal-${statusMap[d] ?? "empty"}`}>{d}</div>
              )}
            </div>
          ))}
        </div>
        <div className="legend">
          <Legend color="var(--success)" label="Present" />
          <Legend color="var(--destructive)" label="Absent" />
          <Legend color="var(--warning)" label="Leave" />
          <Legend color="var(--secondary)" label="Half" />
        </div>
      </section>
    </PhoneShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
