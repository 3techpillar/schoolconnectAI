import { withApiHandler } from "@/lib/server/http";
import { requireApiUser } from "@/shared/auth/require-api";
import { schoolController } from "@/modules/school";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return schoolController.list(req, user);
});
