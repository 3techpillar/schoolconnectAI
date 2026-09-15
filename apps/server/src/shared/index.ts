/**
 * Shared cross-cutting concerns for modular ERP APIs.
 * Prefer importing from here in new `/api/v1` code.
 */
export { requireUser, requireDb, withApiHandler, clientUser } from "@/lib/server/http";
export {
  getSessionFromCookiesOrBearer,
  jsonOk,
  jsonError,
} from "@/lib/server/auth";
export {
  permissionsFor,
  hasPermission,
  requirePermissions,
  type Permission,
} from "@/shared/rbac/permissions";
export {
  tenantSchoolId,
  withTenantFilter,
  assertPermission,
} from "@/shared/tenant/scope";
export { connectMongo, isMongoConfigured, mongoUri } from "@/lib/db/mongodb";
