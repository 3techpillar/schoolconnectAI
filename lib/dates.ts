/** Date helpers for homework deadlines / submission dates. */

export function toIsoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addDaysIso(baseIso: string, days: number) {
  const d = new Date(baseIso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDueLabel(iso?: string, fallback = "This week") {
  if (!iso) return fallback;
  const due = new Date(iso + "T12:00:00");
  if (Number.isNaN(due.getTime())) return fallback;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < -1) return `${Math.abs(diff)}d overdue`;
  return due.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function isDueOverdue(
  iso: string | undefined,
  status: string,
): boolean {
  if (!iso) return false;
  if (status === "submitted" || status === "reviewed") return false;
  const due = new Date(iso + "T23:59:59");
  return due.getTime() < Date.now();
}
