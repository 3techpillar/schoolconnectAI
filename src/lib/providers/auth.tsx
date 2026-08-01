"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, isBackendReady } from "@/lib/shared/api-client";
import {
  nextClassName as nextClassNameUtil,
  parseClassName as parseClassNameUtil,
} from "@/lib/shared/class-utils";
import { appConfig } from "@/lib/shared/config";
import {
  ROLE_LABEL,
  SIGNUP_ROLES,
  isSchoolAdminRole,
  isSuperAdminRole,
  type Role,
} from "@/lib/shared/roles";

export type { Role };
export { ROLE_LABEL, SIGNUP_ROLES };

export interface ClassHistoryEntry {
  sessionId: string;
  sessionLabel: string;
  className: string;
  result: "pass" | "fail" | "pending";
  promotedTo?: string;
  at: number;
}

export interface UserProfile {
  id: string;
  identifier: string;
  identifierType: "email" | "phone";
  name: string;
  role: Role;
  school: string;
  schoolId?: string;
  className?: string;
  classId?: string;
  childName?: string;
  academicYear?: string;
  classHistory?: ClassHistoryEntry[];
  /** Preferred school bus route (demo: route-12) */
  busRouteId?: string;
  /** Home / pickup stop id on that route */
  homeStopId?: string;
  /** Arrival alert preferences */
  busAlert10?: boolean;
  busAlert5?: boolean;
  /** Student / invited staff: pending until class teacher or admin approves */
  enrollmentStatus?: "pending" | "approved" | "rejected";
  /** Invite code used at signup (teachers) */
  inviteCode?: string;
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_KEY = "sc_auth_user_v1";
const USERS_KEY = "sc_users_v1";
const OTP_FIXED = appConfig.demoOtp;

interface AuthCtx {
  user: UserProfile | null;
  ready: boolean;
  /** When true, auth calls hit Mongo-backed /api/* */
  backend: boolean;
  sendOtp: (identifier: string) => Promise<{ ok: true }>;
  verifyOtp: (
    identifier: string,
    otp: string,
  ) => Promise<{ existing: boolean; user?: UserProfile }>;
  completeRegistration: (
    data: Omit<UserProfile, "id" | "createdAt" | "updatedAt" | "classHistory">,
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  /** Refresh session user from the users directory (source of truth). */
  refreshUser: () => Promise<void>;
  listUsers: () => UserProfile[];
  /** Reload directory from API (admin) or local map. */
  refreshDirectory: () => Promise<void>;
  updateUser: (
    id: string,
    patch: Partial<UserProfile>,
  ) => Promise<UserProfile | null>;
  getUserById: (id: string) => UserProfile | null;
}

const Ctx = createContext<AuthCtx | null>(null);

export function loadUsersMap(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsersMap(u: Record<string, UserProfile>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function usersById(): Record<string, UserProfile> {
  const map = loadUsersMap();
  const byId: Record<string, UserProfile> = {};
  Object.values(map).forEach((u) => {
    byId[u.id] = u;
  });
  return byId;
}

function mirrorUserLocal(u: UserProfile) {
  const users = loadUsersMap();
  users[u.identifier.toLowerCase()] = u;
  saveUsersMap(users);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState(false);
  const [directory, setDirectory] = useState<UserProfile[]>([]);
  const backendRef = useRef(false);

  const persistSession = (u: UserProfile | null) => {
    setUser(u);
    // When Mongo/API is up, cookie + /api/me are the source of truth — do not mirror.
    if (backendRef.current) {
      if (!u) localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      mirrorUserLocal(u);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refreshDirectory = async () => {
    if (backendRef.current) {
      try {
        const res = await apiFetch<{ users: UserProfile[] }>("/api/users");
        setDirectory(res.users);
      } catch {
        /* non-admin roles may 403 — keep whatever we have */
      }
      return;
    }
    setDirectory(Object.values(loadUsersMap()));
  };

  const refreshUser = async () => {
    if (backendRef.current) {
      try {
        const res = await apiFetch<{ user: UserProfile }>("/api/me");
        persistSession(res.user);
        return;
      } catch {
        persistSession(null);
        return;
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setUser(null);
        return;
      }
      const session = JSON.parse(raw) as UserProfile;
      const dir = loadUsersMap();
      const canonical =
        dir[session.identifier.toLowerCase()] ||
        Object.values(dir).find((u) => u.id === session.id);
      if (canonical) persistSession(canonical);
      else persistSession(session);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await isBackendReady();
      if (cancelled) return;
      backendRef.current = ok;
      setBackend(ok);
      if (ok) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          const res = await apiFetch<{ user: UserProfile }>("/api/me");
          if (!cancelled) persistSession(res.user);
          await refreshDirectory();
        } catch {
          if (!cancelled) persistSession(null);
        }
      } else {
        await refreshUser();
        setDirectory(Object.values(loadUsersMap()));
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthCtx = {
    user,
    ready,
    backend,
    async sendOtp(identifier) {
      if (backendRef.current) {
        await apiFetch("/api/auth/otp/send", {
          method: "POST",
          body: JSON.stringify({ identifier }),
        });
        return { ok: true };
      }
      return { ok: true };
    },
    async verifyOtp(identifier, otp) {
      if (backendRef.current) {
        const res = await apiFetch<{
          existing: boolean;
          user?: UserProfile;
        }>("/api/auth/otp/verify", {
          method: "POST",
          body: JSON.stringify({ identifier, otp }),
        });
        if (res.existing && res.user) {
          persistSession(res.user);
          return { existing: true, user: res.user };
        }
        return { existing: false };
      }

      if (otp !== OTP_FIXED) {
        throw new Error(`Invalid OTP. Use ${OTP_FIXED} for demo.`);
      }
      const users = loadUsersMap();
      const key = identifier.toLowerCase().trim();
      const existing = users[key];
      if (existing) {
        persistSession(existing);
        return { existing: true, user: existing };
      }
      return { existing: false };
    },
    async completeRegistration(data) {
      if (backendRef.current) {
        const res = await apiFetch<{ user: UserProfile }>(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              identifier: data.identifier,
              identifierType: data.identifierType,
              name: data.name,
              role: data.role,
              school: data.school,
              className: data.className,
              childName: data.childName,
              inviteCode: data.inviteCode,
            }),
          },
        );
        persistSession(res.user);
        return res.user;
      }

      const key = data.identifier.toLowerCase().trim();
      const users = loadUsersMap();
      if (users[key]) {
        persistSession(users[key]);
        return users[key];
      }

      const needsApproval =
        data.role === "student" ||
        data.role === "class_teacher" ||
        data.role === "principal";

      const invitedTeacher =
        Boolean(data.inviteCode) &&
        (data.role === "class_teacher" ||
          data.role === "principal" ||
          data.role === "bus_attendant");

      const newUser: UserProfile = {
        ...data,
        identifier: key,
        id: crypto.randomUUID(),
        academicYear: data.academicYear || "2025-26",
        busRouteId: data.busRouteId || "route-12",
        homeStopId: data.homeStopId || "s3",
        busAlert10: data.busAlert10 ?? true,
        busAlert5: data.busAlert5 ?? true,
        enrollmentStatus: invitedTeacher
          ? "approved"
          : needsApproval
            ? data.enrollmentStatus || "pending"
            : "approved",
        classHistory: data.className
          ? [
              {
                sessionId: "ay-2025-26",
                sessionLabel: data.academicYear || "2025-26",
                className: data.className,
                result: "pending",
                at: Date.now(),
              },
            ]
          : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      users[key] = newUser;
      saveUsersMap(users);
      persistSession(newUser);
      return newUser;
    },
    async logout() {
      if (backendRef.current) {
        try {
          await apiFetch("/api/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
      }
      persistSession(null);
    },
    refreshUser,
    refreshDirectory,
    listUsers() {
      if (backendRef.current && directory.length) {
        return [...directory].sort((a, b) => b.createdAt - a.createdAt);
      }
      return Object.values(loadUsersMap()).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    async updateUser(id, patch) {
      if (backendRef.current) {
        const isSelf = user?.id === id;
        const adminPatch =
          patch.role !== undefined ||
          (patch.className !== undefined && !isSelf) ||
          patch.enrollmentStatus !== undefined;

        try {
          if (adminPatch && !isSelf) {
            const res = await apiFetch<{ user: UserProfile }>(
              `/api/users/${encodeURIComponent(id)}`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  role: patch.role,
                  className: patch.className,
                  enrollmentStatus: patch.enrollmentStatus,
                }),
              },
            );
            setDirectory((prev) =>
              prev.map((u) => (u.id === id ? res.user : u)),
            );
            return res.user;
          }

          if (isSelf) {
            const res = await apiFetch<{ user: UserProfile }>("/api/me", {
              method: "PATCH",
              body: JSON.stringify({
                name: patch.name,
                school: patch.school,
                className: patch.className,
                childName: patch.childName,
                homeStopId: patch.homeStopId,
                busAlert10: patch.busAlert10,
                busAlert5: patch.busAlert5,
              }),
            });
            persistSession(res.user);
            setDirectory((prev) =>
              prev.map((u) => (u.id === id ? res.user : u)),
            );
            return res.user;
          }
        } catch {
          /* fall through */
        }
      }

      const users = loadUsersMap();
      const entry = Object.entries(users).find(([, u]) => u.id === id);
      if (!entry) return null;
      const [key, current] = entry;
      const next: UserProfile = {
        ...current,
        ...patch,
        id: current.id,
        identifier: current.identifier,
        role: patch.role ?? current.role,
        updatedAt: Date.now(),
      };
      users[key] = next;
      saveUsersMap(users);
      if (user?.id === id) persistSession(next);
      setDirectory(Object.values(users));
      return next;
    },
    getUserById(id) {
      if (backendRef.current) {
        return directory.find((u) => u.id === id) || usersById()[id] || null;
      }
      return usersById()[id] || null;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export function isSchoolAdmin(user: UserProfile | null) {
  return isSchoolAdminRole(user?.role);
}

export function isSuperAdmin(user: UserProfile | null) {
  return isSuperAdminRole(user?.role);
}

export function parseClassName(className: string): {
  grade: number;
  section: string;
} | null {
  return parseClassNameUtil(className);
}

export function nextClassName(className: string): string | null {
  return nextClassNameUtil(className);
}
