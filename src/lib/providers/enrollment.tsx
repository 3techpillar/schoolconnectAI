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
  isSchoolAdmin,
  type Role,
  type UserProfile,
  useAuth,
} from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";

export type InviteStatus = "pending" | "accepted" | "revoked";
export type EnrollmentStatus = "pending" | "approved" | "rejected";

export interface TeacherInvite {
  id: string;
  code: string;
  name: string;
  identifier: string;
  school: string;
  role: Extract<Role, "class_teacher" | "principal" | "bus_attendant">;
  className?: string;
  status: InviteStatus;
  invitedById: string;
  invitedByName: string;
  createdAt: number;
  acceptedAt?: number;
  acceptedUserId?: string;
}

export interface StudentEnrollment {
  id: string;
  studentName: string;
  identifier?: string;
  school: string;
  className: string;
  section: string;
  status: EnrollmentStatus;
  addedById: string;
  addedByName: string;
  addedByRole: Role;
  studentUserId?: string;
  createdAt: number;
  reviewedAt?: number;
  reviewedByName?: string;
  note?: string;
}

interface EnrollmentCtx {
  ready: boolean;
  invites: TeacherInvite[];
  enrollments: StudentEnrollment[];
  inviteTeacher: (input: {
    actor: UserProfile;
    name: string;
    identifier: string;
    role?: TeacherInvite["role"];
    className?: string;
  }) => Promise<TeacherInvite>;
  revokeInvite: (id: string, actor: UserProfile) => Promise<void>;
  findInviteByCode: (code: string) => TeacherInvite | null;
  findInviteByIdentifier: (identifier: string) => TeacherInvite | null;
  acceptInvite: (code: string, user: UserProfile) => TeacherInvite | null;
  addStudentEnrollment: (input: {
    actor: UserProfile;
    studentName: string;
    className: string;
    section: string;
    identifier?: string;
  }) => Promise<StudentEnrollment>;
  ensureStudentEnrollment: (user: UserProfile) => StudentEnrollment | null;
  reviewEnrollment: (
    id: string,
    status: "approved" | "rejected",
    actor: UserProfile,
    note?: string,
  ) => Promise<void>;
  pendingEnrollmentsFor: (actor: UserProfile) => StudentEnrollment[];
  pendingInvitesForSchool: (school: string) => TeacherInvite[];
}

const INVITE_KEY = "sc_teacher_invites_v1";
const ENROLL_KEY = "sc_student_enrollments_v1";
const Ctx = createContext<EnrollmentCtx | null>(null);

function makeCode() {
  return `SC-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

function parseClassSection(className: string): {
  className: string;
  section: string;
} {
  const m = className.trim().match(/^(\d{1,2})\s*[-–]?\s*([A-Za-z])$/);
  if (m)
    return {
      className: `${m[1]}-${m[2].toUpperCase()}`,
      section: m[2].toUpperCase(),
    };
  const parts = className.trim().split(/[-–\s]+/);
  if (parts.length >= 2) {
    return {
      className: `${parts[0]}-${parts[1].toUpperCase()}`,
      section: parts[1].toUpperCase(),
    };
  }
  return { className: className.trim() || "6-B", section: "B" };
}

function loadList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function needsEnrollmentApproval(user: UserProfile | null): boolean {
  if (!user) return false;
  if (user.role === "student") {
    if (user.enrollmentStatus === undefined) return false;
    return user.enrollmentStatus !== "approved";
  }
  if (user.role === "class_teacher" || user.role === "principal") {
    if (user.enrollmentStatus === undefined) return false;
    return user.enrollmentStatus !== "approved";
  }
  return false;
}

export function hasFullAppAccess(user: UserProfile | null): boolean {
  return !needsEnrollmentApproval(user);
}

export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const { updateUser, listUsers, refreshUser, backend, ready: authReady, user } =
    useAuth();
  const [invites, setInvites] = useState<TeacherInvite[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [ready, setReady] = useState(false);

  const refreshRemote = useCallback(async () => {
    const [inv, en] = await Promise.all([
      apiFetch<{ invites: TeacherInvite[] }>("/api/invites").catch(() => ({
        invites: [] as TeacherInvite[],
        ok: true as const,
      })),
      apiFetch<{ enrollments: StudentEnrollment[] }>("/api/enrollments").catch(
        () => ({ enrollments: [] as StudentEnrollment[], ok: true as const }),
      ),
    ]);
    setInvites(inv.invites || []);
    setEnrollments(en.enrollments || []);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (backend && user) {
          await refreshRemote();
        } else if (!backend) {
          setInvites(loadList<TeacherInvite>(INVITE_KEY));
          setEnrollments(loadList<StudentEnrollment>(ENROLL_KEY));
        } else {
          setInvites([]);
          setEnrollments([]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, backend, user?.id, refreshRemote, user]);

  const inviteTeacher: EnrollmentCtx["inviteTeacher"] = useCallback(
    async ({ actor, name, identifier, role = "class_teacher", className }) => {
      if (backend) {
        const res = await apiFetch<{ invite: TeacherInvite }>("/api/invites", {
          method: "POST",
          body: JSON.stringify({
            name,
            identifier,
            role,
            className,
            school: actor.school,
          }),
        });
        setInvites((prev) => [res.invite, ...prev]);
        return res.invite;
      }

      const invite: TeacherInvite = {
        id: crypto.randomUUID(),
        code: makeCode(),
        name: name.trim(),
        identifier: identifier.toLowerCase().trim(),
        school: actor.school,
        role,
        className: className?.trim() || undefined,
        status: "pending",
        invitedById: actor.id,
        invitedByName: actor.name,
        createdAt: Date.now(),
      };
      setInvites((prev) => {
        const next = [invite, ...prev];
        saveList(INVITE_KEY, next);
        return next;
      });
      return invite;
    },
    [backend],
  );

  const revokeInvite = useCallback(
    async (id: string, actor: UserProfile) => {
      if (!isSchoolAdmin(actor) && actor.role !== "principal") return;
      if (backend) {
        await apiFetch(`/api/invites/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "revoked" }),
        });
      }
      setInvites((prev) => {
        const next = prev.map((i) =>
          i.id === id && i.status === "pending"
            ? { ...i, status: "revoked" as const }
            : i,
        );
        if (!backend) saveList(INVITE_KEY, next);
        return next;
      });
    },
    [backend],
  );

  const findInviteByCode = useCallback(
    (code: string) => {
      const list = backend ? invites : loadList<TeacherInvite>(INVITE_KEY);
      return (
        list.find(
          (i) =>
            i.code.toUpperCase() === code.trim().toUpperCase() &&
            i.status === "pending",
        ) ||
        invites.find(
          (i) =>
            i.code.toUpperCase() === code.trim().toUpperCase() &&
            i.status === "pending",
        ) ||
        null
      );
    },
    [invites, backend],
  );

  const findInviteByIdentifier = useCallback(
    (identifier: string) => {
      const key = identifier.toLowerCase().trim();
      const list = backend ? invites : loadList<TeacherInvite>(INVITE_KEY);
      return (
        list.find((i) => i.identifier === key && i.status === "pending") ||
        invites.find((i) => i.identifier === key && i.status === "pending") ||
        null
      );
    },
    [invites, backend],
  );

  const acceptInvite = useCallback(
    (code: string, profile: UserProfile) => {
      if (backend) return findInviteByCode(code);
      const invite =
        findInviteByCode(code) || findInviteByIdentifier(profile.identifier);
      if (!invite) return null;
      setInvites((prev) => {
        const next = prev.map((i) =>
          i.id === invite.id
            ? {
                ...i,
                status: "accepted" as const,
                acceptedAt: Date.now(),
                acceptedUserId: profile.id,
              }
            : i,
        );
        saveList(INVITE_KEY, next);
        return next;
      });
      void updateUser(profile.id, {
        role: invite.role,
        school: invite.school,
        className: invite.className || profile.className,
        enrollmentStatus: "approved",
        inviteCode: invite.code,
      });
      void refreshUser();
      return invite;
    },
    [
      backend,
      findInviteByCode,
      findInviteByIdentifier,
      updateUser,
      refreshUser,
    ],
  );

  const addStudentEnrollment: EnrollmentCtx["addStudentEnrollment"] =
    useCallback(
      async ({ actor, studentName, className, section, identifier }) => {
        const parsed = parseClassSection(
          section
            ? `${String(className).replace(/[-–].*$/, "")}-${section}`
            : className,
        );
        if (backend) {
          const res = await apiFetch<{ enrollment: StudentEnrollment }>(
            "/api/enrollments",
            {
              method: "POST",
              body: JSON.stringify({
                studentName,
                className: parsed.className,
                identifier,
              }),
            },
          );
          setEnrollments((prev) => [res.enrollment, ...prev]);
          return res.enrollment;
        }

        const row: StudentEnrollment = {
          id: crypto.randomUUID(),
          studentName: studentName.trim(),
          identifier: identifier?.toLowerCase().trim() || undefined,
          school: actor.school,
          className: parsed.className,
          section: (section || parsed.section).trim().toUpperCase(),
          status: "pending",
          addedById: actor.id,
          addedByName: actor.name,
          addedByRole: actor.role,
          createdAt: Date.now(),
        };
        setEnrollments((prev) => {
          const next = [row, ...prev];
          saveList(ENROLL_KEY, next);
          return next;
        });
        return row;
      },
      [backend],
    );

  const ensureStudentEnrollment = useCallback(
    (profile: UserProfile) => {
      if (profile.role !== "student") return null;

      if (backend) {
        void apiFetch<{
          enrollment: StudentEnrollment;
        }>("/api/enrollments/self", { method: "POST" })
          .then((res) => {
            if (res.enrollment) {
              setEnrollments((prev) => {
                const without = prev.filter((e) => e.id !== res.enrollment.id);
                return [res.enrollment, ...without];
              });
            }
            void refreshUser();
          })
          .catch(() => undefined);
        return null;
      }

      let created: StudentEnrollment | null = null;
      setEnrollments((prev) => {
        const existing =
          prev.find(
            (e) =>
              e.studentUserId === profile.id ||
              (e.identifier &&
                e.identifier === profile.identifier &&
                e.status !== "rejected"),
          ) || null;
        if (existing) {
          created = existing;
          if (!existing.studentUserId) {
            const next = prev.map((e) =>
              e.id === existing.id
                ? {
                    ...e,
                    studentUserId: profile.id,
                    studentName: profile.name,
                  }
                : e,
            );
            saveList(ENROLL_KEY, next);
            return next;
          }
          return prev;
        }
        const parsed = parseClassSection(profile.className || "6-B");
        const row: StudentEnrollment = {
          id: crypto.randomUUID(),
          studentName: profile.name,
          identifier: profile.identifier,
          school: profile.school,
          className: parsed.className,
          section: parsed.section,
          status: "pending",
          addedById: profile.id,
          addedByName: profile.name,
          addedByRole: "student",
          studentUserId: profile.id,
          createdAt: Date.now(),
          note: "Self registration",
        };
        created = row;
        const next = [row, ...prev];
        saveList(ENROLL_KEY, next);
        return next;
      });
      return created;
    },
    [backend, refreshUser],
  );

  const reviewEnrollment = useCallback(
    async (
      id: string,
      status: "approved" | "rejected",
      actor: UserProfile,
      note?: string,
    ) => {
      if (backend) {
        await apiFetch(`/api/enrollments/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status, note }),
        });
        await refreshRemote();
        await refreshUser();
        return;
      }

      setEnrollments((prev) => {
        const row = prev.find((e) => e.id === id);
        if (!row) return prev;
        const next = prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                reviewedAt: Date.now(),
                reviewedByName: actor.name,
                note: note || e.note,
              }
            : e,
        );
        saveList(ENROLL_KEY, next);

        const users = listUsers();
        const match =
          users.find((u) => u.id === row.studentUserId) ||
          users.find(
            (u) =>
              row.identifier &&
              u.identifier === row.identifier &&
              u.role === "student",
          ) ||
          users.find(
            (u) =>
              u.role === "student" &&
              u.name.toLowerCase() === row.studentName.toLowerCase() &&
              u.school.toLowerCase() === row.school.toLowerCase(),
          );

        if (match) {
          void updateUser(match.id, {
            enrollmentStatus: status,
            className: row.className,
            school: row.school,
          });
        }
        return next.map((e) =>
          e.id === id && match ? { ...e, studentUserId: match.id } : e,
        );
      });
      void refreshUser();
    },
    [backend, listUsers, updateUser, refreshUser, refreshRemote],
  );

  const value = useMemo<EnrollmentCtx>(() => {
    return {
      ready,
      invites: [...invites].sort((a, b) => b.createdAt - a.createdAt),
      enrollments: [...enrollments].sort((a, b) => b.createdAt - a.createdAt),
      inviteTeacher,
      revokeInvite,
      findInviteByCode,
      findInviteByIdentifier,
      acceptInvite,
      addStudentEnrollment,
      ensureStudentEnrollment,
      reviewEnrollment,
      pendingEnrollmentsFor: (actor) => {
        return enrollments
          .filter((e) => e.status === "pending")
          .filter((e) => {
            if (isSchoolAdmin(actor) || actor.role === "principal") {
              return e.school.toLowerCase() === actor.school.toLowerCase();
            }
            if (actor.role === "class_teacher") {
              return (
                e.school.toLowerCase() === actor.school.toLowerCase() &&
                (!actor.className || e.className === actor.className)
              );
            }
            return false;
          })
          .sort((a, b) => b.createdAt - a.createdAt);
      },
      pendingInvitesForSchool: (school) =>
        invites.filter(
          (i) =>
            i.status === "pending" &&
            i.school.toLowerCase() === school.toLowerCase(),
        ),
    };
  }, [
    ready,
    invites,
    enrollments,
    inviteTeacher,
    revokeInvite,
    findInviteByCode,
    findInviteByIdentifier,
    acceptInvite,
    addStudentEnrollment,
    ensureStudentEnrollment,
    reviewEnrollment,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEnrollment() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useEnrollment must be used inside EnrollmentProvider");
  }
  return ctx;
}
