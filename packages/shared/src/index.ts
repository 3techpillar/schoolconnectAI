export type { Role } from "./roles";
export {
  ROLE_LABEL,
  SIGNUP_ROLES,
  isSchoolAdminRole,
  isSuperAdminRole,
  canAccessErp,
  canManageFees,
  isFamilyRole,
  canWriteBusProgress,
  canBroadcastNotification,
} from "./roles";

export {
  parseClassName,
  parseClassLabel,
  nextClassName,
} from "./class-utils";

export {
  toIsoDate,
  addDaysIso,
  formatDueLabel,
  isDueOverdue,
} from "./dates";

export { createAppConfig } from "./config";
export type { AppEnv, SharedAppConfigInput } from "./config";

export {
  createApiClient,
  apiFetch,
  ApiError,
  isBackendReady,
} from "./api/client";
export type { ApiResult, CreateApiClientOptions } from "./api/client";

export { formatInrPaise } from "./money";

export {
  DEFAULT_BADGES,
  defaultMissions,
  defaultChallenge,
  yesterdayKey,
  todayKey,
  levelFromXp,
  XP_PER_LEVEL,
} from "./engage-defaults";
export type {
  EngageMood,
  EngageBadge,
  EngageMission,
  EngageChallenge,
} from "./engage-defaults";

export {
  DEFAULT_ROUTE_PATH,
  DEFAULT_BUS_STOPS,
} from "./bus-defaults";
export type { BusStopDef } from "./bus-defaults";

export type {
  ClassHistoryEntry,
  UserProfile,
  StudentStatus,
  GuardianRelationship,
  StudentGuardian,
  StudentProfileDto,
  SchoolDto,
  ClassSectionDto,
  AdmissionApplicationDto,
  StaffProfileDto,
  FeeStructureDto,
  FeeInvoiceDto,
  MessageKind,
  HomeworkStatus,
  HomeworkPriority,
  ChatMessage,
  ChatThread,
  AppNotification,
  HomeworkItem,
  FeeHistoryItem,
  FeesPayload,
  AttendanceSummary,
  FeedItem,
} from "./types";

export {
  needsSchoolAssignment,
  needsEnrollmentApproval,
  hasFullAppAccess,
  isLimitedFamilySurface,
} from "./access";

export {
  normalizeParentAccess,
  usesStudentFamilySurface,
  usesGuardianFamilySurface,
} from "./family";
export type { ParentAccess } from "./family";

export {
  normalizeProductMode,
  normalizeTransferPolicy,
  schoolCapabilities,
  schoolHasModule,
  canAccessErpConsole,
  defaultSubscriptionExpiry,
  isSubscriptionActive,
  toExpiryMs,
  DEFAULT_FREE_SUBSCRIPTION_DAYS,
} from "./product-modes";
export type {
  ProductMode,
  SchoolModule,
  SchoolModuleOverrides,
  SchoolCapabilitiesInput,
  TransferPolicy,
} from "./product-modes";

export * from "./schemas";
export { theme } from "./theme";
export type { Theme } from "./theme";

export {
  DEMO_SCHOOL_GROUPS,
  DEMO_ACCOUNTS,
  DEMO_FAMILY_ACCOUNTS,
  DEMO_ADMIN_ACCOUNTS,
} from "./demo-accounts";
export type { DemoAccount, DemoSchoolGroup } from "./demo-accounts";
