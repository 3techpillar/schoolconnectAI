"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { appConfig } from "@/lib/config";

export type Role =
  | "parent"
  | "student"
  | "class_teacher"
  | "bus_attendant"
  | "principal"
  | "admin"
  | "super_admin";

export const ROLE_LABEL: Record<Role, string> = {
  parent: "Parent",
  student: "Student",
  class_teacher: "Class Teacher",
  bus_attendant: "Bus Attendant",
  principal: "Principal",
  admin: "School Admin",
  super_admin: "Super Admin",
};

/** Roles available during self-signup (super_admin is seeded / assigned). */
export const SIGNUP_ROLES: Role[] = [
  "parent",
  "student",
  "class_teacher",
  "bus_attendant",
  "principal",
  "admin",
  "super_admin",
];

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
  className?: string;
  childName?: string;
  academicYear?: string;
  classHistory?: ClassHistoryEntry[];
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_KEY = "sc_auth_user_v1";
const USERS_KEY = "sc_users_v1";
const OTP_FIXED = appConfig.demoOtp;

interface AuthCtx {
  user: UserProfile | null;
  ready: boolean;
  sendOtp: (identifier: string) => Promise<{ ok: true }>;
  verifyOtp: (
    identifier: string,
    otp: string,
  ) => Promise<{ existing: boolean; user?: UserProfile }>;
  completeRegistration: (
    data: Omit<UserProfile, "id" | "createdAt" | "updatedAt" | "classHistory">,
  ) => UserProfile;
  logout: () => void;
  /** Refresh session user from the users directory (source of truth). */
  refreshUser: () => void;
  listUsers: () => UserProfile[];
  updateUser: (id: string, patch: Partial<UserProfile>) => UserProfile | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  const persistSession = (u: UserProfile | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setUser(null);
        return;
      }
      const session = JSON.parse(raw) as UserProfile;
      const directory = loadUsersMap();
      const canonical =
        directory[session.identifier.toLowerCase()] ||
        Object.values(directory).find((u) => u.id === session.id);
      // Always prefer directory copy so role/class changes stick across logins.
      if (canonical) persistSession(canonical);
      else persistSession(session);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
    setReady(true);
  }, []);

  const value: AuthCtx = {
    user,
    ready,
    async sendOtp() {
      return { ok: true };
    },
    async verifyOtp(identifier, otp) {
      if (otp !== OTP_FIXED) {
        throw new Error(`Invalid OTP. Use ${OTP_FIXED} for demo.`);
      }
      const users = loadUsersMap();
      const key = identifier.toLowerCase().trim();
      const existing = users[key];
      if (existing) {
        // Role selected at signup is permanent for this identity.
        persistSession(existing);
        return { existing: true, user: existing };
      }
      return { existing: false };
    },
    completeRegistration(data) {
      const key = data.identifier.toLowerCase().trim();
      const users = loadUsersMap();
      if (users[key]) {
        // Never overwrite an existing role/profile on re-register attempt.
        persistSession(users[key]);
        return users[key];
      }
      const newUser: UserProfile = {
        ...data,
        identifier: key,
        id: crypto.randomUUID(),
        academicYear: data.academicYear || "2025-26",
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
    logout() {
      persistSession(null);
    },
    refreshUser,
    listUsers() {
      return Object.values(loadUsersMap()).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    updateUser(id, patch) {
      const users = loadUsersMap();
      const entry = Object.entries(users).find(([, u]) => u.id === id);
      if (!entry) return null;
      const [key, current] = entry;
      const next: UserProfile = {
        ...current,
        ...patch,
        id: current.id,
        identifier: current.identifier,
        // Role changes only via explicit patch.role from admin tools.
        role: patch.role ?? current.role,
        updatedAt: Date.now(),
      };
      users[key] = next;
      saveUsersMap(users);
      if (user?.id === id) persistSession(next);
      return next;
    },
    getUserById(id) {
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
  return user?.role === "admin" || user?.role === "super_admin";
}

export function isSuperAdmin(user: UserProfile | null) {
  return user?.role === "super_admin";
}

export function parseClassName(className: string): {
  grade: number;
  section: string;
} | null {
  const m = className.trim().match(/^(\d{1,2})\s*[-–]?\s*([A-Za-z])$/);
  if (!m) return null;
  return { grade: Number(m[1]), section: m[2].toUpperCase() };
}

export function nextClassName(className: string): string | null {
  const parsed = parseClassName(className);
  if (!parsed) return null;
  if (parsed.grade >= 12) return null;
  return `${parsed.grade + 1}-${parsed.section}`;
}
