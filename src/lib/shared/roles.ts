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

export function isSchoolAdminRole(role: Role | string | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: Role | string | null | undefined) {
  return role === "super_admin";
}

/** Parent and student share the same app surface (family access). */
export function isFamilyRole(role: Role | string | null | undefined) {
  return role === "parent" || role === "student";
}

/** Roles that may update shared bus progress / reset trip. */
export function canWriteBusProgress(role: Role | string | null | undefined) {
  return (
    role === "bus_attendant" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "principal"
  );
}

/** Staff who may broadcast school notifications. */
export function canBroadcastNotification(role: Role | string | null | undefined) {
  return (
    role === "class_teacher" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "principal"
  );
}
