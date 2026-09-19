import type { Role } from "./roles";

export type Resource =
  | "student_360"
  | "attendance"
  | "homework"
  | "exams"
  | "fees"
  | "transport"
  | "leave"
  | "circulars"
  | "admin_desk"
  | "library"
  | "inventory"
  | "staff_hr"
  | "audit_logs";

export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "manage"
  | "audit";

export type Scope = "own" | "own_class" | "own_subject" | "branch" | "all";

export interface PermissionRule {
  resource: Resource;
  actions: Action[];
  scope: Scope;
}

/** Master Permission Matrix across all 14 roles */
export const ROLE_PERMISSIONS: Record<Role, PermissionRule[]> = {
  super_admin: [
    { resource: "student_360", actions: ["view", "create", "edit", "delete", "export", "manage", "audit"], scope: "all" },
    { resource: "attendance", actions: ["view", "create", "edit", "delete", "approve", "export", "manage", "audit"], scope: "all" },
    { resource: "homework", actions: ["view", "create", "edit", "delete", "export", "manage"], scope: "all" },
    { resource: "exams", actions: ["view", "create", "edit", "delete", "approve", "export", "manage"], scope: "all" },
    { resource: "fees", actions: ["view", "create", "edit", "delete", "export", "manage", "audit"], scope: "all" },
    { resource: "transport", actions: ["view", "create", "edit", "delete", "export", "manage"], scope: "all" },
    { resource: "leave", actions: ["view", "create", "edit", "delete", "approve", "export", "manage"], scope: "all" },
    { resource: "circulars", actions: ["view", "create", "edit", "delete", "manage"], scope: "all" },
    { resource: "admin_desk", actions: ["view", "create", "edit", "delete", "manage"], scope: "all" },
    { resource: "library", actions: ["view", "create", "edit", "delete", "manage"], scope: "all" },
    { resource: "inventory", actions: ["view", "create", "edit", "delete", "manage"], scope: "all" },
    { resource: "staff_hr", actions: ["view", "create", "edit", "delete", "manage", "audit"], scope: "all" },
    { resource: "audit_logs", actions: ["view", "export", "audit", "manage"], scope: "all" },
  ],
  admin: [
    { resource: "student_360", actions: ["view", "create", "edit", "export", "manage"], scope: "branch" },
    { resource: "attendance", actions: ["view", "create", "edit", "approve", "export", "manage"], scope: "branch" },
    { resource: "homework", actions: ["view", "create", "edit", "delete", "manage"], scope: "branch" },
    { resource: "exams", actions: ["view", "create", "edit", "approve", "export", "manage"], scope: "branch" },
    { resource: "fees", actions: ["view", "create", "edit", "export", "manage"], scope: "branch" },
    { resource: "transport", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "leave", actions: ["view", "create", "edit", "approve", "export", "manage"], scope: "branch" },
    { resource: "circulars", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "admin_desk", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "library", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "inventory", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "staff_hr", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "audit_logs", actions: ["view", "export"], scope: "branch" },
  ],
  principal: [
    { resource: "student_360", actions: ["view", "export"], scope: "branch" },
    { resource: "attendance", actions: ["view", "approve", "export"], scope: "branch" },
    { resource: "homework", actions: ["view"], scope: "branch" },
    { resource: "exams", actions: ["view", "approve", "export"], scope: "branch" },
    { resource: "fees", actions: ["view", "export"], scope: "branch" },
    { resource: "transport", actions: ["view"], scope: "branch" },
    { resource: "leave", actions: ["view", "approve", "export"], scope: "branch" },
    { resource: "circulars", actions: ["view", "create", "edit"], scope: "branch" },
    { resource: "admin_desk", actions: ["view", "approve"], scope: "branch" },
    { resource: "staff_hr", actions: ["view", "approve"], scope: "branch" },
    { resource: "audit_logs", actions: ["view"], scope: "branch" },
  ],
  vice_principal: [
    { resource: "student_360", actions: ["view"], scope: "branch" },
    { resource: "attendance", actions: ["view", "approve"], scope: "branch" },
    { resource: "homework", actions: ["view"], scope: "branch" },
    { resource: "exams", actions: ["view", "edit"], scope: "branch" },
    { resource: "leave", actions: ["view", "approve"], scope: "branch" },
    { resource: "circulars", actions: ["view", "create"], scope: "branch" },
    { resource: "admin_desk", actions: ["view"], scope: "branch" },
  ],
  class_teacher: [
    { resource: "student_360", actions: ["view"], scope: "own_class" },
    { resource: "attendance", actions: ["view", "create", "edit", "approve"], scope: "own_class" },
    { resource: "homework", actions: ["view", "create", "edit", "delete"], scope: "own_class" },
    { resource: "exams", actions: ["view", "create", "edit"], scope: "own_class" },
    { resource: "leave", actions: ["view", "approve"], scope: "own_class" },
    { resource: "circulars", actions: ["view", "create"], scope: "branch" },
  ],
  subject_teacher: [
    { resource: "student_360", actions: ["view"], scope: "own_subject" },
    { resource: "attendance", actions: ["view", "create"], scope: "own_subject" },
    { resource: "homework", actions: ["view", "create", "edit"], scope: "own_subject" },
    { resource: "exams", actions: ["view", "create", "edit"], scope: "own_subject" },
    { resource: "circulars", actions: ["view"], scope: "branch" },
  ],
  accountant: [
    { resource: "fees", actions: ["view", "create", "edit", "export", "manage"], scope: "branch" },
    { resource: "student_360", actions: ["view"], scope: "branch" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
    { resource: "attendance", actions: ["view"], scope: "own" },
  ],
  receptionist: [
    { resource: "student_360", actions: ["view"], scope: "branch" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
    { resource: "circulars", actions: ["view"], scope: "branch" },
  ],
  librarian: [
    { resource: "library", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "student_360", actions: ["view"], scope: "branch" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
  ],
  transport_manager: [
    { resource: "transport", actions: ["view", "create", "edit", "manage"], scope: "branch" },
    { resource: "student_360", actions: ["view"], scope: "branch" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
  ],
  bus_driver: [
    { resource: "transport", actions: ["view", "edit"], scope: "own" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
  ],
  bus_attendant: [
    { resource: "transport", actions: ["view", "edit"], scope: "own" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
  ],
  student: [
    { resource: "student_360", actions: ["view"], scope: "own" },
    { resource: "attendance", actions: ["view"], scope: "own" },
    { resource: "homework", actions: ["view", "create"], scope: "own" },
    { resource: "exams", actions: ["view"], scope: "own" },
    { resource: "transport", actions: ["view"], scope: "own" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
    { resource: "circulars", actions: ["view"], scope: "branch" },
  ],
  parent: [
    { resource: "student_360", actions: ["view"], scope: "own" },
    { resource: "attendance", actions: ["view"], scope: "own" },
    { resource: "homework", actions: ["view"], scope: "own" },
    { resource: "exams", actions: ["view"], scope: "own" },
    { resource: "fees", actions: ["view", "create"], scope: "own" },
    { resource: "transport", actions: ["view"], scope: "own" },
    { resource: "leave", actions: ["view", "create"], scope: "own" },
    { resource: "circulars", actions: ["view"], scope: "branch" },
  ],
};

/** Evaluates if a role has authorization for a given resource and action */
export function hasPermission(
  role: Role | string | null | undefined,
  resource: Resource,
  action: Action,
  requestedScope?: Scope,
): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false;
  const rules = ROLE_PERMISSIONS[role as Role];
  const rule = rules.find((r) => r.resource === resource);
  if (!rule) return false;
  if (!rule.actions.includes(action)) return false;

  if (!requestedScope) return true;
  if (rule.scope === "all") return true;
  if (rule.scope === "branch" && requestedScope !== "all") return true;
  if (rule.scope === requestedScope) return true;

  return false;
}
