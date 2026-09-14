import { withApiHandler } from "@/lib/server/http";
import { requireApiUser } from "@/shared/auth/require-api";
import { feeController } from "@/modules/fee";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireApiUser();
  if (error || !user) return error!;
  return feeController.list(req, user);
});
