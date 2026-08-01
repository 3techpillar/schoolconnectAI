import { ClassDesk } from "@/lib/models/ClassDesk";
import { Homework } from "@/lib/models/Homework";
import type { User } from "@/lib/models/User";
import { ensureSchoolDemoData } from "@/lib/server/seed-school";
import { formatDueLabel } from "@/lib/shared/dates";

type UserInstance = InstanceType<typeof User>;

export type FeedItemClient = {
  id: string;
  kind: "circular" | "homework" | "action";
  title: string;
  meta: string;
  href: string;
  tone: "tone-secondary" | "tone-info" | "tone-success" | "tone-primary" | "tone-warning";
  badge?: { label: string; className: string };
  createdAtMs: number;
};

function relativeAgo(ms: number) {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins || 1} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export async function buildHomeFeed(
  user: UserInstance,
  opts?: { limit?: number },
): Promise<FeedItemClient[]> {
  if (!user.schoolId) return [];
  await ensureSchoolDemoData(user.schoolId);
  const limit = opts?.limit ?? 8;
  const className = user.className || "6-B";
  const items: FeedItemClient[] = [];

  const desk = await ClassDesk.findOne({
    schoolId: user.schoolId,
    className,
  });

  for (const c of desk?.circulars || []) {
    const createdAtMs = c.createdAt || Date.now();
    items.push({
      id: `circular-${c.key}`,
      kind: "circular",
      title: c.title,
      meta: `Circular · ${relativeAgo(createdAtMs)}`,
      href: "/circulars",
      tone: "tone-secondary",
      badge:
        user && (c.unreadBy || []).includes(String(user._id))
          ? { label: "New", className: "badge badge-secondary" }
          : undefined,
      createdAtMs,
    });
  }

  const hw = await Homework.find({
    schoolId: user.schoolId,
    className,
  })
    .sort({ createdAtMs: -1 })
    .limit(10);

  for (const h of hw) {
    const createdAtMs = h.createdAtMs || Date.now();
    const due = h.dueDate
      ? formatDueLabel(h.dueDate)
      : h.due || "No due date";
    items.push({
      id: `hw-${String(h._id)}`,
      kind: "homework",
      title: `${h.subject}: ${h.title}`,
      meta: `Homework · ${due}`,
      href: "/homework",
      tone: "tone-info",
      badge:
        h.status === "pending" || h.status === "in-progress"
          ? { label: "Pending", className: "badge badge-warning" }
          : h.status === "submitted"
            ? { label: "Done", className: "badge badge-success" }
            : undefined,
      createdAtMs,
    });
  }

  items.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return items.slice(0, limit);
}

export async function homeworkStats(user: UserInstance) {
  if (!user.schoolId) {
    return { total: 0, pending: 0, label: "0", hint: "None" };
  }
  const className = user.className || "6-B";
  const list = await Homework.find({
    schoolId: user.schoolId,
    className,
  }).limit(50);
  const pending = list.filter(
    (h) => h.status === "pending" || h.status === "in-progress",
  ).length;
  return {
    total: list.length,
    pending,
    label: String(list.length),
    hint: pending ? `${pending} pending` : "All clear",
  };
}
