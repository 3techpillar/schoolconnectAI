import { connectMongo, isMongoConfigured } from "@/lib/db/mongodb";
import { User, userToClient } from "@/lib/models/User";
import {
  AUTH_COOKIE,
  jsonError,
  jsonOk,
  sessionCookieOptions,
  signSession,
} from "@/lib/server/auth";
import {
  markIdentifierVerified,
  verifyOtpChallenge,
} from "@/lib/server/otp-service";
import { normalizeIdentifier } from "@/lib/server/request";
import { otpVerifySchema } from "@/lib/server/schemas";
import { parseBodyWithSchema } from "@/lib/server/validate";
import { withApiHandler } from "@/lib/server/http";
import { cookies } from "next/headers";

async function postHandler(req: Request) {
  if (!isMongoConfigured()) {
    return jsonError("MONGODB_URI is not configured", 503);
  }

  const parsed = await parseBodyWithSchema(req, otpVerifySchema);
  if ("error" in parsed) return parsed.error;

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const otp = parsed.data.otp.trim();

  await connectMongo();

  const verified = await verifyOtpChallenge(identifier, otp);
  if (!verified.ok) {
    return jsonError(verified.error, verified.status);
  }

  const existing = await User.findOne({ identifier });
  if (existing) {
    const token = await signSession({
      sub: String(existing._id),
      role: existing.role as never,
      schoolId: existing.schoolId ? String(existing.schoolId) : undefined,
      enrollmentStatus: existing.enrollmentStatus as never,
    });
    const jar = await cookies();
    jar.set(AUTH_COOKIE, token, sessionCookieOptions());
    return jsonOk({
      existing: true,
      user: userToClient(existing),
      token,
    });
  }

  await markIdentifierVerified(identifier);
  return jsonOk({ existing: false, verified: true });
}

export const POST = withApiHandler(postHandler);
