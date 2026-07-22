"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/auth";
import { useSchoolData } from "@/lib/school-data";
import { useTeacherClass, type AttendMark } from "@/lib/teacher-class";

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

const MARKS: AttendMark[] = ["P", "A", "L", "H"];

export default function AttendancePage() {
  const { user } = useAuth();
  const { canPostAsTeacher } = useSchoolData();
  const {
    ready,
    roster,
    todayMarks,
    presentCount,
    markedCount,
    setMark,
    markAllPresent,
    todayKey,
  } = useTeacherClass();

  const teacher = canPostAsTeacher(user);
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  if (!ready) {
    return (
      <PhoneShell subtitle="Loading" title="Attendance">
        <p className="muted text-sm">Loading…</p>
      </PhoneShell>
    );
  }

  const pct =
    markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

  return (
    <PhoneShell
      subtitle={teacher ? `Class ${user?.className || "6-B"} · ${todayKey}` : "June 2026"}
      title="Attendance"
    >
      {teacher ? (
        <>
          <section className="card" style={{ padding: "1.25rem" }}>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <div>
                <p className="text-xs muted">Today’s class</p>
                <p
                  className="tone-success font-semibold"
                  style={{
                    fontSize: "2.25rem",
                    margin: "0.25rem 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {pct}%
                </p>
              </div>
              <div
                className="text-xs muted"
                style={{ marginLeft: "auto", textAlign: "right", lineHeight: 1.6 }}
              >
                <p style={{ margin: 0 }}>
                  {presentCount} Present · {markedCount}/{roster.length} marked
                </p>
                <button
                  type="button"
                  className="tone-primary font-semibold"
                  style={{ marginTop: 4 }}
                  onClick={() => markAllPresent()}
                >
                  Mark all Present
                </button>
              </div>
            </div>
            <div className="progress">
              <span style={{ width: `${pct}%` }} />
            </div>
          </section>

          <ul className="roster-list mt-4">
            {roster.map((s) => {
              const mark = todayMarks[s.id];
              return (
                <li key={s.id} className="roster-card">
                  <div className="row" style={{ gap: 10 }}>
                    <div className="roster-avatar">{s.avatar}</div>
                    <div className="grow">
                      <p className="font-semibold text-sm" style={{ margin: 0 }}>
                        {s.rollNo}. {s.name}
                      </p>
                      <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                        Tap P / A / L / H
                      </p>
                    </div>
                  </div>
                  <div className="mark-row mt-2">
                    {MARKS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`mark-btn mark-${m} ${mark === m ? "active" : ""}`}
                        onClick={() => setMark(s.id, m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          <Link href="/class" className="btn-primary mt-4">
            Open teacher class desk
          </Link>
        </>
      ) : (
        <>
          <section className="card" style={{ padding: "1.25rem" }}>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <div>
                <p className="text-xs muted">This month</p>
                <p
                  className="tone-success font-semibold"
                  style={{
                    fontSize: "2.25rem",
                    margin: "0.25rem 0 0",
                    letterSpacing: "-0.02em",
                  }}
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
                    <div className={`cal-day cal-${statusMap[d] ?? "empty"}`}>
                      {d}
                    </div>
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
        </>
      )}
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
