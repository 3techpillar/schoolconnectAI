export type Role =
  | "super_admin"
  | "admin"
  | "principal"
  | "vice_principal"
  | "class_teacher"
  | "subject_teacher"
  | "accountant"
  | "receptionist"
  | "librarian"
  | "transport_manager"
  | "bus_driver"
  | "bus_attendant"
  | "student"
  | "parent";

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "School Admin",
  principal: "Principal",
  vice_principal: "Vice Principal",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
  accountant: "Accountant",
  receptionist: "Receptionist",
  librarian: "Librarian",
  transport_manager: "Transport Manager",
  bus_driver: "Bus Driver",
  bus_attendant: "Bus Attendant",
  student: "Student",
  parent: "Parent",
};

/** Roles available during signup/assignment. */
export const SIGNUP_ROLES: Role[] = [
  "parent",
  "student",
  "class_teacher",
  "subject_teacher",
  "bus_attendant",
  "bus_driver",
  "transport_manager",
  "librarian",
  "receptionist",
  "accountant",
  "vice_principal",
  "principal",
  "admin",
  "super_admin",
];

export function isSchoolAdminRole(role: Role | string | null | undefined) {
  return role === "admin" || role === "super_admin" || role === "principal" || role === "vice_principal";
}

export function isSuperAdminRole(role: Role | string | null | undefined) {
  return role === "super_admin";
}

/** Desktop ERP console access (school ops MDM). */
export function canAccessErp(role: Role | string | null | undefined) {
  return (
    role === "admin" ||
    role === "super_admin" ||
    role === "principal" ||
    role === "vice_principal" ||
    role === "accountant" ||
    role === "transport_manager" ||
    role === "receptionist" ||
    role === "librarian"
  );
}

/** Fee structures / invoices / receipts. */
export function canManageFees(role: Role | string | null | undefined) {
  return (
    role === "accountant" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "principal"
  );
}

/** Parent and student share the same app surface (family access). */
export function isFamilyRole(role: Role | string | null | undefined) {
  return role === "parent" || role === "student";
}

/** Roles that may update shared bus progress / reset trip. */
export function canWriteBusProgress(role: Role | string | null | undefined) {
  return (
    role === "bus_attendant" ||
    role === "bus_driver" ||
    role === "transport_manager" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "principal"
  );
}

/** Staff who may broadcast school notifications. */
export function canBroadcastNotification(role: Role | string | null | undefined) {
  return (
    role === "class_teacher" ||
    role === "subject_teacher" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "principal" ||
    role === "vice_principal"
  );
}
