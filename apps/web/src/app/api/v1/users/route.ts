import { withApiHandler } from "@/lib/server/http";
import { requireApiUser } from "@/shared/auth/require-api";
import { userController } from "@/modules/user";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return userController.list(req, user);
});
