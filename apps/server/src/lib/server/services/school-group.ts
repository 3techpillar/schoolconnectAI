import type { SchoolDoc } from "@/lib/models/core/School";
import { normalizeTransferPolicy } from "@schoolconnect/shared";

/** True when two campuses belong to the same multi-branch group. */
export function schoolsInSameGroup(
  a: Pick<SchoolDoc, "_id" | "groupCode" | "parentSchoolId">,
  b: Pick<SchoolDoc, "_id" | "groupCode" | "parentSchoolId">,
): boolean {
  const ga = (a.groupCode || "").trim().toUpperCase();
  const gb = (b.groupCode || "").trim().toUpperCase();
  if (ga && gb && ga === gb) return true;

  const pa = a.parentSchoolId ? String(a.parentSchoolId) : "";
  const pb = b.parentSchoolId ? String(b.parentSchoolId) : "";
  if (pa && pb && pa === pb) return true;
  if (pa && pa === String(b._id)) return true;
  if (pb && pb === String(a._id)) return true;
  return false;
}

/**
 * Same-group always OK.
 * Cross-group OK when destination campus has transferPolicy === "open"
 * (destination opts into receiving external students; still requires dest admin approve).
 */
export function canTransferBetweenCampuses(
  from: Pick<
    SchoolDoc,
    "_id" | "groupCode" | "parentSchoolId" | "transferPolicy"
  >,
  to: Pick<
    SchoolDoc,
    "_id" | "groupCode" | "parentSchoolId" | "transferPolicy"
  >,
): { ok: boolean; kind: "same_group" | "cross_group" | "blocked"; reason?: string } {
  if (String(from._id) === String(to._id)) {
    return {
      ok: false,
      kind: "blocked",
      reason: "Destination must be a different campus",
    };
  }
  if (schoolsInSameGroup(from, to)) {
    return { ok: true, kind: "same_group" };
  }
  if (normalizeTransferPolicy(to.transferPolicy) === "open") {
    return { ok: true, kind: "cross_group" };
  }
  return {
    ok: false,
    kind: "blocked",
    reason:
      "Cross-group transfer blocked. Destination must use transferPolicy=open, or campuses must share groupCode.",
  };
}
