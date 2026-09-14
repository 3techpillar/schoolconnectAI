import { withApiHandler, clientUserWithCapabilities } from "@/lib/server/http";
import { requireApiUser } from "@/shared/auth/require-api";
import { jsonOk } from "@/lib/server/auth";
import { permissionsFor } from "@/shared/rbac/permissions";

/** Current session + RBAC permissions (auth layer surface). */
export const GET = withApiHandler(async () => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return jsonOk({
    user: await clientUserWithCapabilities(user),
    permissions: permissionsFor(user.role),
  });
});
