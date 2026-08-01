"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth, type UserProfile } from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  studentName: string;
  school: string;
  className?: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
  note?: string;
}

interface LeavesCtx {
  ready: boolean;
  leaves: LeaveRequest[];
  myLeaves: (userId: string) => LeaveRequest[];
  pendingLeaves: LeaveRequest[];
  applyLeave: (input: {
    user: UserProfile;
    studentName: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => Promise<LeaveRequest>;
  reviewLeave: (
    id: string,
    status: "approved" | "rejected",
    reviewer: UserProfile,
    note?: string,
  ) => Promise<void>;
  approvedLeaveDates: (user: UserProfile | null) => Set<string>;
  isApprovedLeaveDay: (user: UserProfile | null, dateKey: string) => boolean;
}

const STORAGE_KEY = "sc_leaves_v1";
const Ctx = createContext<LeavesCtx | null>(null);

function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const a = new Date(from + "T12:00:00");
  const b = new Date(to + "T12:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return out;
  const start = a <= b ? a : b;
  const end = a <= b ? b : a;
  const cur = new Date(start);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function seedLeaves(): LeaveRequest[] {
  const now = Date.now();
  const y = new Date().getFullYear();
  const m = String(new Date().getMonth() + 1).padStart(2, "0");
  return [
    {
      id: "lv-seed-1",
      applicantId: "seed-parent",
      applicantName: "Priya Sharma",
      applicantRole: "parent",
      studentName: "Aarav Sharma",
      school: "Delhi Public School, Bengaluru",
      className: "6-B",
      fromDate: `${y}-${m}-18`,
      toDate: `${y}-${m}-18`,
      reason: "Family function",
      status: "approved",
      appliedAt: now - 1000 * 60 * 60 * 24 * 8,
      reviewedBy: "Ms. Kapoor",
      reviewedAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "lv-seed-2",
      applicantId: "seed-parent",
      applicantName: "Priya Sharma",
      applicantRole: "parent",
      studentName: "Aarav Sharma",
      school: "Delhi Public School, Bengaluru",
      className: "6-B",
      fromDate: `${y}-${m}-26`,
      toDate: `${y}-${m}-26`,
      reason: "Medical checkup",
      status: "approved",
      appliedAt: now - 1000 * 60 * 60 * 24 * 3,
      reviewedBy: "Ms. Kapoor",
      reviewedAt: now - 1000 * 60 * 60 * 24 * 2,
    },
  ];
}

function loadLeaves(): LeaveRequest[] {
  if (typeof window === "undefined") return seedLeaves();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedLeaves();
    const parsed = JSON.parse(raw) as LeaveRequest[];
    return parsed.length ? parsed : seedLeaves();
  } catch {
    return seedLeaves();
  }
}

export function LeavesProvider({ children }: { children: ReactNode }) {
  const { backend, ready: authReady, user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (backend && user) {
          const res = await apiFetch<{ leaves: LeaveRequest[] }>("/api/leaves");
          if (!cancelled) setLeaves(res.leaves);
        } else if (!backend) {
          if (!cancelled) setLeaves(loadLeaves());
        } else if (!cancelled) {
          setLeaves([]);
        }
      } catch {
        if (!cancelled && !backend) setLeaves(loadLeaves());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, backend, user?.id, user]);

  const applyLeave: LeavesCtx["applyLeave"] = useCallback(
    async ({ user: actor, studentName, fromDate, toDate, reason }) => {
      if (backend) {
        const res = await apiFetch<{ leave: LeaveRequest }>("/api/leaves", {
          method: "POST",
          body: JSON.stringify({ studentName, fromDate, toDate, reason }),
        });
        setLeaves((prev) => [res.leave, ...prev]);
        return res.leave;
      }

      const req: LeaveRequest = {
        id: crypto.randomUUID(),
        applicantId: actor.id,
        applicantName: actor.name,
        applicantRole: actor.role,
        studentName: studentName.trim(),
        school: actor.school,
        className: actor.className,
        fromDate,
        toDate,
        reason: reason.trim(),
        status: "pending",
        appliedAt: Date.now(),
      };
      setLeaves((prev) => {
        const next = [req, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return req;
    },
    [backend],
  );

  const reviewLeave: LeavesCtx["reviewLeave"] = useCallback(
    async (id, status, reviewer, note) => {
      if (backend) {
        await apiFetch(`/api/leaves/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status, note }),
        });
      }
      setLeaves((prev) => {
        const next = prev.map((l) =>
          l.id === id
            ? {
                ...l,
                status,
                reviewedBy: reviewer.name,
                reviewedAt: Date.now(),
                note: note?.trim() || undefined,
              }
            : l,
        );
        if (!backend) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [backend],
  );

  const approvedLeaveDates = useCallback(
    (profile: UserProfile | null) => {
      const set = new Set<string>();
      if (!profile) return set;
      leaves
        .filter((l) => {
          if (l.status !== "approved") return false;
          if (profile.role === "student") {
            return (
              l.applicantId === profile.id ||
              l.studentName.toLowerCase() === profile.name.toLowerCase()
            );
          }
          if (profile.role === "parent") {
            return (
              l.applicantId === profile.id ||
              (profile.childName &&
                l.studentName.toLowerCase() ===
                  profile.childName.toLowerCase())
            );
          }
          if (
            profile.role === "class_teacher" ||
            profile.role === "principal"
          ) {
            return !profile.className || l.className === profile.className;
          }
          return l.school.toLowerCase() === profile.school.toLowerCase();
        })
        .forEach((l) => {
          daysBetween(l.fromDate, l.toDate).forEach((d) => set.add(d));
        });
      return set;
    },
    [leaves],
  );

  const value = useMemo<LeavesCtx>(() => {
    return {
      ready,
      leaves,
      myLeaves: (userId) => leaves.filter((l) => l.applicantId === userId),
      pendingLeaves: leaves.filter((l) => l.status === "pending"),
      applyLeave,
      reviewLeave,
      approvedLeaveDates,
      isApprovedLeaveDay: (profile, dateKey) =>
        approvedLeaveDates(profile).has(dateKey),
    };
  }, [ready, leaves, applyLeave, reviewLeave, approvedLeaveDates]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLeaves() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLeaves must be used inside LeavesProvider");
  return ctx;
}

export function formatLeaveRange(from: string, to: string) {
  if (from === to) return formatShortDate(from);
  return `${formatShortDate(from)} – ${formatShortDate(to)}`;
}

export function formatShortDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export { daysBetween };
