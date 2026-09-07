import type { UserProfile } from "./types/user";
import { isFamilyRole } from "./roles";

/** Backend mode: schoolId required. Offline demo: school name string. */
export function needsSchoolAssignment(
  user: UserProfile | null,
  backend = true,
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return false;
  if (backend) return !user.schoolId;
  return !user.school?.trim();
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

export function hasFullAppAccess(
  user: UserProfile | null,
  backend = true,
): boolean {
  if (!user) return false;
  if (needsSchoolAssignment(user, backend)) return false;
  return !needsEnrollmentApproval(user);
}

export function isLimitedFamilySurface(user: UserProfile | null) {
  return Boolean(user && isFamilyRole(user.role));
}
