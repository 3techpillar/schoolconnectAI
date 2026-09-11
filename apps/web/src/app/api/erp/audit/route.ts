import { ErpAuditLog, erpAuditLogToClient } from "@/lib/models/erp/ErpAuditLog";
import { jsonOk } from "@/lib/server/auth";
import { requireErpUser, resolveErpSchoolId } from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;

  const filter: Record<string, unknown> = {};
  if (scope.schoolId) filter.schoolId = scope.schoolId;

  const logs = await ErpAuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);
  return jsonOk({ logs: logs.map(erpAuditLogToClient) });
});
