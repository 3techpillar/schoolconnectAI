import { withApiHandler } from "@/lib/server/http";
import { requireApiUser } from "@/shared/auth/require-api";
import { studentController } from "@/modules/student";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return studentController.list(req, user);
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return studentController.create(req, user);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  const body = await req.clone().json().catch(() => ({}));
  const id = String((body as { id?: string }).id || "");
  return studentController.update(req, user, id);
});
