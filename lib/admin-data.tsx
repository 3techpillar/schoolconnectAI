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
import {
  nextClassName,
  useAuth,
  type ClassHistoryEntry,
  type Role,
  type UserProfile,
} from "@/lib/auth";

export interface AcademicSession {
  id: string;
  label: string;
  school: string;
  status: "active" | "completed";
  startsOn: string;
  endsOn: string;
}

export interface SchoolRecord {
  id: string;
  name: string;
  city: string;
  adminCount: number;
  studentCount: number;
  status: "active" | "paused";
}

export interface PromotionResult {
  studentId: string;
  name: string;
  fromClass: string;
  toClass: string | null;
  result: "pass" | "fail";
}

interface AdminState {
  sessions: AcademicSession[];
  schools: SchoolRecord[];
  promotionLog: Array<{
    id: string;
    sessionId: string;
    at: number;
    by: string;
    results: PromotionResult[];
  }>;
}

interface AdminCtx extends AdminState {
  ready: boolean;
  activeSession: AcademicSession | null;
  promoteStudents: (input: {
    sessionId: string;
    decisions: Array<{ studentId: string; result: "pass" | "fail" }>;
    actor: UserProfile;
    /** Optional prebuilt results (e.g. demo roster) to log without user accounts. */
    externalResults?: PromotionResult[];
  }) => PromotionResult[];
  completeSession: (sessionId: string, actor: UserProfile) => void;
  startNextSession: (actor: UserProfile) => AcademicSession;
  setUserRole: (userId: string, role: Role, actor: UserProfile) => void;
  setUserClass: (userId: string, className: string, actor: UserProfile) => void;
  toggleSchoolStatus: (schoolId: string, actor: UserProfile) => void;
}

const STORAGE_KEY = "sc_admin_data_v1";
const Ctx = createContext<AdminCtx | null>(null);

function defaultState(): AdminState {
  return {
    sessions: [
      {
        id: "ay-2025-26",
        label: "2025-26",
        school: "Delhi Public School, Bengaluru",
        status: "active",
        startsOn: "2025-04-01",
        endsOn: "2026-03-31",
      },
      {
        id: "ay-2024-25",
        label: "2024-25",
        school: "Delhi Public School, Bengaluru",
        status: "completed",
        startsOn: "2024-04-01",
        endsOn: "2025-03-31",
      },
    ],
    schools: [
      {
        id: "sch-dps",
        name: "Delhi Public School, Bengaluru",
        city: "Bengaluru",
        adminCount: 1,
        studentCount: 6,
        status: "active",
      },
      {
        id: "sch-ris",
        name: "Ryan International",
        city: "Mumbai",
        adminCount: 0,
        studentCount: 0,
        status: "active",
      },
      {
        id: "sch-kv",
        name: "Kendriya Vidyalaya",
        city: "Delhi",
        adminCount: 0,
        studentCount: 0,
        status: "paused",
      },
    ],
    promotionLog: [],
  };
}

function loadState(): AdminState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { updateUser, listUsers, getUserById } = useAuth();
  const [state, setState] = useState<AdminState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  const commit = useCallback((updater: (prev: AdminState) => AdminState) => {
    setState((prev) => {
      const next = updater(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const promoteStudents: AdminCtx["promoteStudents"] = useCallback(
    ({ sessionId, decisions, actor, externalResults }) => {
      const session =
        state.sessions.find((s) => s.id === sessionId) || state.sessions[0];
      const results: PromotionResult[] = [...(externalResults || [])];

      decisions.forEach(({ studentId, result }) => {
        const student =
          getUserById(studentId) ||
          listUsers().find((u) => u.id === studentId);
        if (!student || student.role !== "student" || !student.className) return;

        const toClass =
          result === "pass"
            ? nextClassName(student.className)
            : student.className;
        const historyEntry: ClassHistoryEntry = {
          sessionId: session.id,
          sessionLabel: session.label,
          className: student.className,
          result,
          promotedTo: result === "pass" ? toClass || undefined : undefined,
          at: Date.now(),
        };

        updateUser(student.id, {
          className:
            result === "pass" && toClass ? toClass : student.className,
          academicYear: session.label,
          classHistory: [...(student.classHistory || []), historyEntry],
        });

        results.push({
          studentId: student.id,
          name: student.name,
          fromClass: student.className,
          toClass: result === "pass" ? toClass : student.className,
          result,
        });
      });

      commit((prev) => ({
        ...prev,
        promotionLog: [
          {
            id: crypto.randomUUID(),
            sessionId: session.id,
            at: Date.now(),
            by: actor.name,
            results,
          },
          ...prev.promotionLog,
        ],
      }));

      return results;
    },
    [commit, getUserById, listUsers, state.sessions, updateUser],
  );

  const completeSession = useCallback(
    (sessionId: string, actor: UserProfile) => {
      commit((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, status: "completed" as const } : s,
        ),
        promotionLog: [
          {
            id: crypto.randomUUID(),
            sessionId,
            at: Date.now(),
            by: actor.name,
            results: [],
          },
          ...prev.promotionLog,
        ],
      }));
    },
    [commit],
  );

  const startNextSession = useCallback(
    (actor: UserProfile) => {
      const active = state.sessions.find((s) => s.status === "active");
      const label = active
        ? `${Number(active.label.slice(0, 4)) + 1}-${String(Number(active.label.slice(0, 4)) + 2).slice(2)}`
        : "2026-27";
      const next: AcademicSession = {
        id: `ay-${label}`,
        label,
        school: actor.school,
        status: "active",
        startsOn: `${label.slice(0, 4)}-04-01`,
        endsOn: `20${label.slice(5)}-03-31`,
      };
      commit((prev) => ({
        ...prev,
        sessions: [
          next,
          ...prev.sessions.map((s) =>
            s.status === "active" ? { ...s, status: "completed" as const } : s,
          ),
        ],
      }));
      return next;
    },
    [commit, state.sessions],
  );

  const setUserRole = useCallback(
    (userId: string, role: Role, actor: UserProfile) => {
      if (actor.role !== "admin" && actor.role !== "super_admin") return;
      if (role === "super_admin" && actor.role !== "super_admin") return;
      updateUser(userId, { role });
    },
    [updateUser],
  );

  const setUserClass = useCallback(
    (userId: string, className: string, actor: UserProfile) => {
      if (actor.role !== "admin" && actor.role !== "super_admin" && actor.role !== "principal") {
        return;
      }
      updateUser(userId, { className });
    },
    [updateUser],
  );

  const toggleSchoolStatus = useCallback(
    (schoolId: string, actor: UserProfile) => {
      if (actor.role !== "super_admin") return;
      commit((prev) => ({
        ...prev,
        schools: prev.schools.map((s) =>
          s.id === schoolId
            ? {
                ...s,
                status: s.status === "active" ? "paused" : "active",
              }
            : s,
        ),
      }));
    },
    [commit],
  );

  const value = useMemo<AdminCtx>(() => {
    const activeSession =
      state.sessions.find((s) => s.status === "active") || null;
    return {
      ...state,
      ready,
      activeSession,
      promoteStudents,
      completeSession,
      startNextSession,
      setUserRole,
      setUserClass,
      toggleSchoolStatus,
    };
  }, [
    state,
    ready,
    promoteStudents,
    completeSession,
    startNextSession,
    setUserRole,
    setUserClass,
    toggleSchoolStatus,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminData must be used inside AdminDataProvider");
  return ctx;
}
