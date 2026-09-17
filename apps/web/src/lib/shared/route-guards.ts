import { hasPermission, type Role } from "@schoolconnect/shared";

/** Route-to-RBAC permission mappings */
const ROUTE_PERMISSIONS: Record<string, { resource: Parameters<typeof hasPermission>[1]; action: Parameters<typeof hasPermission>[2] }> = {
  "/admin": { resource: "admin_desk", action: "view" },
  "/erp": { resource: "admin_desk", action: "view" },
  "/fees": { resource: "fees", action: "view" },
  "/class": { resource: "attendance", action: "create" },
  "/bus": { resource: "transport", action: "view" },
  "/homework": { resource: "homework", action: "view" },
  "/engage": { resource: "student_360", action: "view" },
  "/circulars": { resource: "circulars", action: "view" },
};

/** Evaluates whether a role can navigate to a given route */
export function canAccessRoute(
  role: Role | string | null | undefined,
  pathname: string,
): boolean {
  if (!role) return false;

  // Exact or prefix route match
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!matchedRoute) return true; // Unrestricted public/general pages like /, /profile, /chats, /more

  const { resource, action } = ROUTE_PERMISSIONS[matchedRoute];
  return hasPermission(role, resource, action);
}
