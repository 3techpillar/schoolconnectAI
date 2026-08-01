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
  useAuth,
  type ClassHistoryEntry,
  type Role,
  type UserProfile,
} from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";
import { nextClassName } from "@/lib/shared/class-utils";

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
  const {
    updateUser,
    listUsers,
    getUserById,
    backend,
    ready: authReady,
    user,
    refreshDirectory,
  } = useAuth();
  const [state, setState] = useState<AdminState>(defaultState);
  const [ready, setReady] = useState(false);

  const reloadRemote = useCallback(async () => {
    const res = await apiFetch<{
      sessions: AcademicSession[];
      schools: SchoolRecord[];
      promotionLog: AdminState["promotionLog"];
      users: UserProfile[];
    }>("/api/admin");
    setState({
      sessions: res.sessions,
      schools: res.schools,
      promotionLog: res.promotionLog,
    });
    await refreshDirectory();
  }, [refreshDirectory]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (
          backend &&
          user &&
          (user.role === "admin" ||
            user.role === "super_admin" ||
            user.role === "principal")
        ) {
          await reloadRemote();
        } else if (!backend) {
          if (!cancelled) setState(loadState());
        }
      } catch {
        if (!cancelled && !backend) setState(loadState());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, backend, user?.id, user?.role, reloadRemote, user]);

  const commit = useCallback(
    (updater: (prev: AdminState) => AdminState) => {
      setState((prev) => {
        const next = updater(prev);
        if (!backend) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [backend],
  );

  const promoteStudents: AdminCtx["promoteStudents"] = useCallback(
    ({ sessionId, decisions, actor, externalResults }) => {
      if (backend) {
        let results: PromotionResult[] = [...(externalResults || [])];
        void (async () => {
          try {
            const res = await apiFetch<{
              results: PromotionResult[];
              promotionLog: AdminState["promotionLog"];
            }>("/api/admin", {
              method: "POST",
              body: JSON.stringify({
                action: "promote",
                sessionId,
                decisions,
                externalResults,
              }),
            });
            results = res.results;
            setState((prev) => ({
              ...prev,
              promotionLog: res.promotionLog,
            }));
            await refreshDirectory();
          } catch {
            /* ignore */
          }
        })();
        return results.length ? results : [...(externalResults || [])];
      }

      const session =
        state.sessions.find((s) => s.id === sessionId) || state.sessions[0];
      const results: PromotionResult[] = [...(externalResults || [])];

      decisions.forEach(({ studentId, result }) => {
        const student =
          getUserById(studentId) ||
          listUsers().find((u) => u.id === studentId);
        if (!student || student.role !== "student" || !student.className) return;

        const fromClass = student.className;
        const toClass =
          result === "pass" ? nextClassName(student.className) : student.className;
        const historyEntry: ClassHistoryEntry = {
          sessionId: session.id,
          sessionLabel: session.label,
          className: fromClass,
          result,
          promotedTo: result === "pass" ? toClass || undefined : undefined,
          at: Date.now(),
        };

        void updateUser(student.id, {
          className:
            result === "pass" && toClass ? toClass : student.className,
          academicYear: session.label,
          classHistory: [...(student.classHistory || []), historyEntry],
        });

        results.push({
          studentId: student.id,
          name: student.name,
          fromClass,
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
    [
      backend,
      commit,
      getUserById,
      listUsers,
      state.sessions,
      updateUser,
      refreshDirectory,
    ],
  );

  const completeSession = useCallback(
    (sessionId: string, actor: UserProfile) => {
      if (backend) {
        void apiFetch("/api/admin", {
          method: "POST",
          body: JSON.stringify({ action: "completeSession", sessionId }),
        })
          .then(() => reloadRemote())
          .catch(() => undefined);
        return;
      }
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
    [backend, commit, reloadRemote],
  );

  const startNextSession = useCallback(
    (actor: UserProfile) => {
      if (backend) {
        const optimistic: AcademicSession = {
          id: `ay-pending`,
          label: "…",
          school: actor.school,
          status: "active",
          startsOn: "",
          endsOn: "",
        };
        void (async () => {
          try {
            const res = await apiFetch<{ session: AcademicSession }>(
              "/api/admin",
              {
                method: "POST",
                body: JSON.stringify({ action: "startNextSession" }),
              },
            );
            await reloadRemote();
            Object.assign(optimistic, res.session);
          } catch {
            /* ignore */
          }
        })();
        return optimistic;
      }

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
    [backend, commit, state.sessions, reloadRemote],
  );

  const setUserRole = useCallback(
    (userId: string, role: Role, actor: UserProfile) => {
      if (actor.role !== "admin" && actor.role !== "super_admin") return;
      if (role === "super_admin" && actor.role !== "super_admin") return;
      void updateUser(userId, { role }).then(() => refreshDirectory());
    },
    [updateUser, refreshDirectory],
  );

  const setUserClass = useCallback(
    (userId: string, className: string, actor: UserProfile) => {
      if (
        actor.role !== "admin" &&
        actor.role !== "super_admin" &&
        actor.role !== "principal"
      ) {
        return;
      }
      void updateUser(userId, { className }).then(() => refreshDirectory());
    },
    [updateUser, refreshDirectory],
  );

  const toggleSchoolStatus = useCallback(
    (schoolId: string, actor: UserProfile) => {
      if (actor.role !== "super_admin") return;
      if (backend) {
        void apiFetch("/api/admin", {
          method: "POST",
          body: JSON.stringify({ action: "toggleSchool", schoolId }),
        })
          .then(() => reloadRemote())
          .catch(() => undefined);
        return;
      }
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
    [backend, commit, reloadRemote],
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
