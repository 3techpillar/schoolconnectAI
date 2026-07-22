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
  | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  parent: "Parent",
  student: "Student",
  class_teacher: "Class Teacher",
  bus_attendant: "Bus Attendant",
  principal: "Principal",
  admin: "School Admin",
};

export interface UserProfile {
  id: string;
  identifier: string;
  identifierType: "email" | "phone";
  name: string;
  role: Role;
  school: string;
  className?: string;
  childName?: string;
  createdAt: number;
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
    data: Omit<UserProfile, "id" | "createdAt">,
  ) => UserProfile;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function loadUsers(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(u: Record<string, UserProfile>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  const persist = (u: UserProfile | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

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
      const users = loadUsers();
      const existing = users[identifier.toLowerCase()];
      if (existing) {
        persist(existing);
        return { existing: true, user: existing };
      }
      return { existing: false };
    },
    completeRegistration(data) {
      const newUser: UserProfile = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      const users = loadUsers();
      users[data.identifier.toLowerCase()] = newUser;
      saveUsers(users);
      persist(newUser);
      return newUser;
    },
    logout() {
      persist(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
