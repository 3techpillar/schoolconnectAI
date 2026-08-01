import {
  ensureFeeAccount,
  feeAccountToClient,
  recordFeePayment,
} from "@/lib/server/fees-service";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { feesPaySchema } from "@/lib/server/schemas";
import { requireUser, withApiHandler } from "@/lib/server/http";

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const doc = await ensureFeeAccount(user);
  if (!doc) return jsonError("Could not load fees", 500);
  return jsonOk({ fees: feeAccountToClient(doc) });
}

/** Demo Pay now — records full outstanding as paid. Swap for gateway later. */
async function postHandler(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  let title: string | undefined;
  const text = await req.text();
  if (text.trim()) {
    try {
      const parsed = feesPaySchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        return jsonError(
          parsed.error.issues.map((i) => i.message).join("; ") ||
            "Validation failed",
          400,
        );
      }
      title = parsed.data.title;
    } catch {
      return jsonError("Invalid JSON body", 400);
    }
  }

  const doc = await ensureFeeAccount(user);
  if (!doc) return jsonError("Could not load fees", 500);

  const result = await recordFeePayment(doc, { title });

  return jsonOk({
    fees: feeAccountToClient(result.doc),
    alreadyPaid: result.alreadyPaid,
  });
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
