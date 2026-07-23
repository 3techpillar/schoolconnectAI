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
import type { UserProfile } from "@/lib/auth";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  studentName: string;
  school: string;
  className?: string;
  fromDate: string; // YYYY-MM-DD
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
  }) => LeaveRequest;
  reviewLeave: (
    id: string,
    status: "approved" | "rejected",
    reviewer: UserProfile,
    note?: string,
  ) => void;
  /** Date keys (YYYY-MM-DD) covered by approved leaves for this user/child. */
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
    {
      id: "lv-seed-3",
      applicantId: "seed-parent",
      applicantName: "Priya Sharma",
      applicantRole: "parent",
      studentName: "Aarav Sharma",
      school: "Delhi Public School, Bengaluru",
      className: "6-B",
      fromDate: `${y}-${m}-28`,
      toDate: `${y}-${m}-29`,
      reason: "Out of town",
      status: "pending",
      appliedAt: now - 1000 * 60 * 60 * 6,
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
  const [leaves, setLeaves] = useState<LeaveRequest[]>(seedLeaves);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLeaves(loadLeaves());
    setReady(true);
  }, []);

  const applyLeave: LeavesCtx["applyLeave"] = useCallback(
    ({ user, studentName, fromDate, toDate, reason }) => {
      const req: LeaveRequest = {
        id: crypto.randomUUID(),
        applicantId: user.id,
        applicantName: user.name,
        applicantRole: user.role,
        studentName: studentName.trim(),
        school: user.school,
        className: user.className,
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
    [],
  );

  const reviewLeave: LeavesCtx["reviewLeave"] = useCallback(
    (id, status, reviewer, note) => {
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const approvedLeaveDates = useCallback(
    (user: UserProfile | null) => {
      const set = new Set<string>();
      if (!user) return set;
      leaves
        .filter((l) => {
          if (l.status !== "approved") return false;
          if (user.role === "student") {
            return (
              l.applicantId === user.id ||
              l.studentName.toLowerCase() === user.name.toLowerCase()
            );
          }
          if (user.role === "parent") {
            return (
              l.applicantId === user.id ||
              (user.childName &&
                l.studentName.toLowerCase() === user.childName.toLowerCase())
            );
          }
          // Teachers see class leaves by className match
          if (user.role === "class_teacher" || user.role === "principal") {
            return !user.className || l.className === user.className;
          }
          return l.applicantId === user.id;
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
      leaves: [...leaves].sort((a, b) => b.appliedAt - a.appliedAt),
      myLeaves: (userId) =>
        leaves
          .filter((l) => l.applicantId === userId)
          .sort((a, b) => b.appliedAt - a.appliedAt),
      pendingLeaves: leaves
        .filter((l) => l.status === "pending")
        .sort((a, b) => b.appliedAt - a.appliedAt),
      applyLeave,
      reviewLeave,
      approvedLeaveDates,
      isApprovedLeaveDay: (user, dateKey) =>
        approvedLeaveDates(user).has(dateKey),
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
