import { withApiHandler } from "@/lib/server/http";
import { requireErpUser } from "@/lib/server/services/erp";
import { studentController } from "@/modules/student";

/**
 * Legacy ERP students API — delegates to modular student controller
 * so ERP UI and /api/v1 share one code path.
 */
export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;
  return studentController.list(req, user);
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;
  return studentController.create(req, user);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;
  const body = await req.clone().json().catch(() => ({}));
  const id = String((body as { id?: string }).id || "");
  return studentController.update(req, user, id);
});
