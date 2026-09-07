import type { Role } from "./roles";
import {
  canAccessErp as canAccessErpRole,
  isSuperAdminRole,
} from "./roles";

export type ProductMode = "connect" | "erp";

/** Feature modules that can be toggled per school (settings.modules overrides). */
export type SchoolModule =
  | "chats"
  | "homework"
  | "circulars"
  | "notifications"
  | "bus"
  | "leaves"
  | "attendance"
  | "admin"
  | "fees"
  | "exams"
  | "erp";

export type SchoolModuleOverrides = Partial<Record<SchoolModule, boolean>>;

/** group_only = same groupCode only; open = destination may accept cross-group. */
export type TransferPolicy = "group_only" | "open";

export type SchoolCapabilitiesInput = {
  productMode?: ProductMode | string | null;
  settings?: {
    modules?: SchoolModuleOverrides;
    [key: string]: unknown;
  } | null;
  subscriptionExpiresAt?: number | Date | string | null;
  transferPolicy?: TransferPolicy | string | null;
};

/** Defaults for Connect (communication) product. */
const CONNECT_MODULES: Record<SchoolModule, boolean> = {
  chats: true,
  homework: true,
  circulars: true,
  notifications: true,
  bus: true,
  leaves: true,
  attendance: true,
  admin: true,
  fees: false,
  exams: false,
  erp: false,
};

/** Full ERP includes Connect + management modules. */
const ERP_MODULES: Record<SchoolModule, boolean> = {
  ...CONNECT_MODULES,
  fees: true,
  exams: true,
  erp: true,
};

export function normalizeProductMode(
  mode: string | null | undefined,
): ProductMode {
  return mode === "erp" ? "erp" : "connect";
}

export function normalizeTransferPolicy(
  policy: string | null | undefined,
): TransferPolicy {
  return policy === "open" ? "open" : "group_only";
}

export function schoolCapabilities(
  school: SchoolCapabilitiesInput | null | undefined,
): Record<SchoolModule, boolean> {
  const mode = normalizeProductMode(school?.productMode);
  const base = mode === "erp" ? { ...ERP_MODULES } : { ...CONNECT_MODULES };
  const overrides = school?.settings?.modules || {};
  for (const [key, value] of Object.entries(overrides)) {
    if (key in base && typeof value === "boolean") {
      base[key as SchoolModule] = value;
    }
  }
  return base;
}

export function schoolHasModule(
  school: SchoolCapabilitiesInput | null | undefined,
  module: SchoolModule,
): boolean {
  return Boolean(schoolCapabilities(school)[module]);
}

/**
 * Role may use ERP console AND school has ERP product mode (or erp module).
 * Super Admin always may open ERP (platform onboarding / mode switches).
 */
export function canAccessErpConsole(
  role: Role | string | null | undefined,
  school: SchoolCapabilitiesInput | null | undefined,
): boolean {
  if (isSuperAdminRole(role)) return true;
  return canAccessErpRole(role) && schoolHasModule(school, "erp");
}

/** Default free trial length for new schools. */
export const DEFAULT_FREE_SUBSCRIPTION_DAYS = 365;

export function defaultSubscriptionExpiry(
  from: Date = new Date(),
  days = DEFAULT_FREE_SUBSCRIPTION_DAYS,
): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function toExpiryMs(
  value: number | Date | string | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Active when no expiry set, or expiry is in the future. */
export function isSubscriptionActive(
  school: SchoolCapabilitiesInput | null | undefined,
  now = Date.now(),
): boolean {
  const ms = toExpiryMs(school?.subscriptionExpiresAt ?? null);
  if (ms == null) return true;
  return ms > now;
}
