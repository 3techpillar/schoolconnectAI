/** Re-exports from @schoolconnect/shared for gradual @/ imports. */
export type { Role } from "@schoolconnect/shared";
export {
  ROLE_LABEL,
  SIGNUP_ROLES,
  isSchoolAdminRole,
  isSuperAdminRole,
  isFamilyRole,
  canWriteBusProgress,
  canBroadcastNotification,
} from "@schoolconnect/shared";

export {
  parseClassName,
  parseClassLabel,
  nextClassName,
} from "@schoolconnect/shared";

export {
  toIsoDate,
  addDaysIso,
  formatDueLabel,
  isDueOverdue,
} from "@schoolconnect/shared";

export { appConfig } from "./config";
export type { AppEnv } from "./config";

export { apiFetch, ApiError, isBackendReady } from "./api-client";
export type { ApiResult } from "./api-client";

export { formatInrPaise } from "@schoolconnect/shared";

export {
  DEFAULT_BADGES,
  defaultMissions,
  defaultChallenge,
  yesterdayKey,
  todayKey,
  levelFromXp,
  XP_PER_LEVEL,
} from "@schoolconnect/shared";
export type {
  EngageMood,
  EngageBadge,
  EngageMission,
  EngageChallenge,
} from "@schoolconnect/shared";
