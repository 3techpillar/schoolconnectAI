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
import { useAuth, type UserProfile, type Role } from "@/lib/providers/auth";
import { useLeaves } from "@/lib/providers/leaves";
import { apiFetch } from "@/lib/shared/api-client";
import { toIsoDate } from "@/lib/shared/dates";

export type StaffMark = "P" | "A" | "L" | "H";

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  avatar: string;
  school: string;
  className?: string;
  identifier: string;
}

interface StaffAttendanceState {
  staffRoster: StaffMember[];
  attendanceByDay: Record<string, Record<string, StaffMark>>;
}

interface StaffAttendanceCtx {
  ready: boolean;
  todayKey: string;
  staffRoster: StaffMember[];
  todayMarks: Record<string, StaffMark>;
  setStaffMark: (staffId: string, mark: StaffMark, dateKey?: string) => void;
  markAllStaffPresent: (dateKey?: string) => void;
  getStaffMonthStatusMap: (
    staffId: string,
    year: number,
    month: number, // 0-indexed
  ) => Record<number, StaffMark | null>;
  getStaffMonthStats: (
    staffId: string,
    year: number,
    month: number,
  ) => {
    present: number;
    absent: number;
    leave: number;
    half: number;
    pct: number;
  };
}

const STORAGE_KEY = "sc_staff_attendance_v1";
const Ctx = createContext<StaffAttendanceCtx | null>(null);

function todayKeyStr() {
  return toIsoDate();
}

function seedStaffRoster(): StaffMember[] {
  return [
    {
      id: "staff-kapoor",
      name: "Ms. Kapoor",
      role: "class_teacher",
      roleLabel: "Class Teacher",
      avatar: "MK",
      school: "Delhi Public School, Bengaluru",
      className: "6-B",
      identifier: "teacher@radoms.demo",
    },
    {
      id: "staff-verma",
      name: "Rajesh Verma",
      role: "bus_attendant",
      roleLabel: "Bus Attendant",
      avatar: "RV",
      school: "Delhi Public School, Bengaluru",
      identifier: "bus@radoms.demo",
    },
    {
      id: "staff-sharma",
      name: "Sanjay Sharma",
      role: "accountant",
      roleLabel: "Accountant",
      avatar: "SS",
      school: "Delhi Public School, Bengaluru",
      identifier: "accountant@radoms.demo",
    },
    {
      id: "staff-singh",
      name: "Dr. Anita Singh",
      role: "principal",
      roleLabel: "Principal",
      avatar: "AS",
      school: "Delhi Public School, Bengaluru",
      identifier: "principal@radoms.demo",
    },
  ];
}

function defaultState(): StaffAttendanceState {
  const day = todayKeyStr();
  const roster = seedStaffRoster();
  const marks: Record<string, StaffMark> = {};
  roster.forEach((s) => {
    marks[s.id] = "P";
  });
  return {
    staffRoster: roster,
    attendanceByDay: { [day]: marks },
  };
}

function loadState(): StaffAttendanceState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as StaffAttendanceState;
    return {
      staffRoster: parsed.staffRoster?.length ? parsed.staffRoster : seedStaffRoster(),
      attendanceByDay: parsed.attendanceByDay || {},
    };
  } catch {
    return defaultState();
  }
}

export function StaffAttendanceProvider({ children }: { children: ReactNode }) {
  const { backend, ready: authReady, user, listUsers } = useAuth();
  const { leaves, approvedLeaveDates } = useLeaves();
  const [state, setState] = useState<StaffAttendanceState>(defaultState);
  const [ready, setReady] = useState(false);
  const day = todayKeyStr();

  useEffect(() => {
    if (!authReady) return;
    const allUsers = listUsers();
    const staffFromUsers: StaffMember[] = allUsers
      .filter((u) => u.role !== "student" && u.role !== "parent")
      .map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        roleLabel: u.role.replace("_", " "),
        avatar: u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
        school: u.school,
        className: u.className,
        identifier: u.identifier,
      }));

    const roster = staffFromUsers.length ? staffFromUsers : seedStaffRoster();
    const loaded = loadState();

    setState((prev) => ({
      ...prev,
      staffRoster: roster,
      attendanceByDay: loaded.attendanceByDay,
    }));
    setReady(true);
  }, [authReady, listUsers]);

  const commit = useCallback(
    (updater: (prev: StaffAttendanceState) => StaffAttendanceState) => {
      setState((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const setStaffMark = useCallback(
    (staffId: string, mark: StaffMark, dateKey = day) => {
      commit((prev) => ({
        ...prev,
        attendanceByDay: {
          ...prev.attendanceByDay,
          [dateKey]: {
            ...(prev.attendanceByDay[dateKey] || {}),
            [staffId]: mark,
          },
        },
      }));
    },
    [commit, day],
  );

  const markAllStaffPresent = useCallback(
    (dateKey = day) => {
      commit((prev) => {
        const existing = prev.attendanceByDay[dateKey] || {};
        const marks: Record<string, StaffMark> = {};
        prev.staffRoster.forEach((s) => {
          marks[s.id] = existing[s.id] === "L" ? "L" : "P";
        });
        return {
          ...prev,
          attendanceByDay: {
            ...prev.attendanceByDay,
            [dateKey]: marks,
          },
        };
      });
    },
    [commit, day],
  );

  const getStaffMonthStatusMap = useCallback(
    (staffId: string, year: number, month: number) => {
      const map: Record<number, StaffMark | null> = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Find approved leave dates for this staff member
      const staffUser = state.staffRoster.find((s) => s.id === staffId);
      const leaveSet = new Set<string>();

      leaves
        .filter(
          (l) =>
            l.status === "approved" &&
            (l.applicantId === staffId ||
              (staffUser && l.studentName.toLowerCase() === staffUser.name.toLowerCase())),
        )
        .forEach((l) => {
          const from = new Date(l.fromDate + "T12:00:00");
          const to = new Date(l.toDate + "T12:00:00");
          const cur = new Date(from);
          while (cur <= to) {
            leaveSet.add(cur.toISOString().slice(0, 10));
            cur.setDate(cur.getDate() + 1);
          }
        });

      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dow = new Date(year, month, d).getDay();
        if (dow === 0) {
          map[d] = null; // Sunday off
          continue;
        }
        if (leaveSet.has(key)) {
          map[d] = "L";
          continue;
        }
        const record = state.attendanceByDay[key]?.[staffId];
        if (record) {
          map[d] = record;
        } else {
          // Demo base pattern for un-marked weekdays
          if (d % 17 === 0) map[d] = "A";
          else if (d % 19 === 0) map[d] = "H";
          else map[d] = "P";
        }
      }
      return map;
    },
    [leaves, state.attendanceByDay, state.staffRoster],
  );

  const getStaffMonthStats = useCallback(
    (staffId: string, year: number, month: number) => {
      const map = getStaffMonthStatusMap(staffId, year, month);
      let present = 0;
      let absent = 0;
      let leave = 0;
      let half = 0;
      Object.values(map).forEach((s) => {
        if (s === "P") present += 1;
        if (s === "A") absent += 1;
        if (s === "L") leave += 1;
        if (s === "H") half += 1;
      });
      const marked = present + absent + leave + half;
      const pct = marked ? Math.round((present / marked) * 100) : 0;
      return { present, absent, leave, half, pct };
    },
    [getStaffMonthStatusMap],
  );

  const value = useMemo<StaffAttendanceCtx>(() => {
    const todayMarks = state.attendanceByDay[day] || {};
    return {
      ready,
      todayKey: day,
      staffRoster: state.staffRoster,
      todayMarks,
      setStaffMark,
      markAllStaffPresent,
      getStaffMonthStatusMap,
      getStaffMonthStats,
    };
  }, [
    state,
    ready,
    day,
    setStaffMark,
    markAllStaffPresent,
    getStaffMonthStatusMap,
    getStaffMonthStats,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStaffAttendance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStaffAttendance must be used inside StaffAttendanceProvider");
  return ctx;
}
