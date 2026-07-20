import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — SchoolConnect AI" }] }),
  component: AttendancePage,
});

// June 2026 mock: 1 = Sun start. June 1 2026 is a Monday.
const startWeekday = 1; // Monday offset (0=Sun)
const daysInMonth = 30;

type Status = "P" | "A" | "L" | "H" | null;
const statusMap: Record<number, Status> = {};
// seed pattern
[1,2,3,4,5,8,9,10,11,12,15,16,17,19,22,23,24,25].forEach(d => statusMap[d] = "P");
[6,13,20,27,7,14,21,28].forEach(d => statusMap[d] = null); // weekends
statusMap[18] = "A";
statusMap[26] = "L";
statusMap[29] = "H";
statusMap[30] = "P";

const toneFor = (s: Status) => {
  switch (s) {
    case "P": return "bg-success text-success-foreground";
    case "A": return "bg-destructive text-destructive-foreground";
    case "L": return "bg-warning text-warning-foreground";
    case "H": return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function AttendancePage() {
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <PhoneShell subtitle="June 2026" title="Attendance">
      <section className="rounded-2xl bg-surface border border-border p-5">
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-muted-foreground">This month</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-success leading-none">96%</p>
          </div>
          <div className="ml-auto text-right text-xs text-muted-foreground leading-relaxed">
            <p>20 Present</p>
            <p>1 Absent · 1 Leave · 1 Half</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-success" style={{ width: "96%" }} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-surface border border-border p-4">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-muted-foreground mb-2">
          {["S","M","T","W","T","F","S"].map((d,i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => (
            <div key={i} className="aspect-square">
              {d && (
                <div className={`h-full w-full rounded-lg text-[11px] font-medium grid place-items-center ${toneFor(statusMap[d] ?? null)}`}>
                  {d}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] font-medium">
          <Legend dot="bg-success" label="Present" />
          <Legend dot="bg-destructive" label="Absent" />
          <Legend dot="bg-warning" label="Leave" />
          <Legend dot="bg-secondary" label="Half" />
        </div>
      </section>
    </PhoneShell>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
