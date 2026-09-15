import { connectMongo, isMongoConfigured } from "@/lib/db/mongodb";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { issueOtp } from "@/lib/server/services/otp-service";
import { identifierSchema } from "@/lib/server/schemas";
import { normalizeIdentifier } from "@/lib/server/request";
import { parseBodyWithSchema } from "@/lib/server/validate";
import { withApiHandler } from "@/lib/server/http";

async function postHandler(req: Request) {
  if (!isMongoConfigured()) {
    return jsonError("MONGODB_URI is not configured", 503);
  }

  const parsed = await parseBodyWithSchema(req, identifierSchema);
  if ("error" in parsed) return parsed.error;
  const identifier = normalizeIdentifier(parsed.data.identifier);

  await connectMongo();
  const result = await issueOtp(identifier);
  if (!result.ok) {
    const res = jsonError(result.error, result.status);
    if (result.retryAfterSec) {
      res.headers.set("Retry-After", String(result.retryAfterSec));
    }
    return res;
  }

  return jsonOk({
    sent: true,
    demo: result.demo,
    ...(result.hint ? { hint: result.hint } : {}),
  });
}

export const POST = withApiHandler(postHandler);
