import type { UserProfile } from "./types/user";
import { isFamilyRole } from "./roles";

/** How a parent uses the family app. */
export type ParentAccess = "guardian" | "student";

export function normalizeParentAccess(
  value?: string | null,
): ParentAccess {
  return value === "student" ? "student" : "guardian";
}

/** Student chrome (Zone-first). Students, and parents who opted into student-only access. */
export function usesStudentFamilySurface(user: UserProfile | null): boolean {
  if (!user || !isFamilyRole(user.role)) return false;
  if (user.role === "student") return true;
  return normalizeParentAccess(user.parentAccess) === "student";
}

/** Parent trust chrome — attendance, report, progress on top. */
export function usesGuardianFamilySurface(user: UserProfile | null): boolean {
  return Boolean(
    user &&
      user.role === "parent" &&
      normalizeParentAccess(user.parentAccess) === "guardian",
  );
}
