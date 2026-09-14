import { withApiHandler } from "@/lib/server/http";
import { requireApiUser } from "@/shared/auth/require-api";
import { leaveController } from "@/modules/leave";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return leaveController.list(req, user);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return leaveController.review(req, user);
});
