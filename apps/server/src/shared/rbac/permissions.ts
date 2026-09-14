import type { Role } from "@schoolconnect/shared";

/** Fine-grained permissions for School ERP APIs. */
export type Permission =
  | "school:read"
  | "school:write"
  | "student:read"
  | "student:write"
  | "class:read"
  | "class:write"
  | "attendance:read"
  | "attendance:write"
  | "fee:read"
  | "fee:write"
  | "leave:read"
  | "leave:write"
  | "leave:review"
  | "exam:read"
  | "exam:write"
  | "user:read"
  | "user:write"
  | "erp:access"
  | "audit:read";

const ALL: Permission[] = [
  "school:read",
  "school:write",
  "student:read",
  "student:write",
  "class:read",
  "class:write",
  "attendance:read",
  "attendance:write",
  "fee:read",
  "fee:write",
  "leave:read",
  "leave:write",
  "leave:review",
  "exam:read",
  "exam:write",
  "user:read",
  "user:write",
  "erp:access",
  "audit:read",
];

/** Role → permissions matrix (BRD RBAC). */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  admin: ALL,
  principal: [
    "school:read",
    "student:read",
    "student:write",
    "class:read",
    "class:write",
    "attendance:read",
    "attendance:write",
    "fee:read",
    "leave:read",
    "leave:review",
    "exam:read",
    "exam:write",
    "user:read",
    "erp:access",
    "audit:read",
  ],
  accountant: [
    "school:read",
    "student:read",
    "fee:read",
    "fee:write",
    "erp:access",
    "audit:read",
  ],
  class_teacher: [
    "student:read",
    "class:read",
    "attendance:read",
    "attendance:write",
    "leave:read",
    "leave:review",
    "exam:read",
    "exam:write",
  ],
  bus_attendant: ["attendance:read"],
  parent: ["student:read", "attendance:read", "fee:read", "leave:write", "leave:read"],
  student: ["student:read", "attendance:read", "leave:write", "leave:read", "exam:read"],
};

export function permissionsFor(role: Role | string | null | undefined): Permission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) return [];
  return ROLE_PERMISSIONS[role as Role];
}

export function hasPermission(
  role: Role | string | null | undefined,
  permission: Permission,
): boolean {
  return permissionsFor(role).includes(permission);
}

export function requirePermissions(
  role: Role | string | null | undefined,
  ...needed: Permission[]
): boolean {
  return needed.every((p) => hasPermission(role, p));
}
