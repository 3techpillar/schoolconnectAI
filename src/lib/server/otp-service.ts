import { OtpChallenge } from "@/lib/models/OtpChallenge";
import {
  generateNumericOtp,
  hashOtpCode,
  otpHashesEqual,
} from "@/lib/server/hash";
import { appConfig } from "@/lib/shared/config";

const SEND_COOLDOWN_MS = 30_000;
const SEND_WINDOW_MS = 15 * 60_000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const OTP_TTL_MS = 10 * 60_000;
const VERIFIED_TTL_MS = 30 * 60_000;

export type OtpSendResult =
  | {
      ok: true;
      demo: boolean;
      hint?: string;
      retryAfterSec?: number;
    }
  | { ok: false; error: string; status: number; retryAfterSec?: number };

export type OtpVerifyResult =
  | { ok: true; challengeId: string }
  | { ok: false; error: string; status: number };

function demoCode(): string {
  return process.env.OTP_DEMO_CODE || appConfig.demoOtp || "000000";
}

function isDemoProvider() {
  return (process.env.OTP_PROVIDER || "demo") === "demo";
}

/** Client may show demo OTP only when both provider and public demoMode are on. */
export function shouldExposeDemoOtpHint() {
  return isDemoProvider() && appConfig.demoMode;
}

export async function issueOtp(identifier: string): Promise<OtpSendResult> {
  const now = Date.now();
  const recent = await OtpChallenge.find({
    identifier,
    kind: "otp",
    createdAt: { $gte: new Date(now - SEND_WINDOW_MS) },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_SENDS_PER_WINDOW + 1);

  if (recent.length >= MAX_SENDS_PER_WINDOW) {
    return {
      ok: false,
      error: "Too many OTP requests. Try again later.",
      status: 429,
      retryAfterSec: Math.ceil(SEND_WINDOW_MS / 1000),
    };
  }

  const last = recent[0];
  if (last?.createdAt) {
    const elapsed = now - new Date(last.createdAt as Date).getTime();
    if (elapsed < SEND_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        ok: false,
        error: `Please wait ${retryAfterSec}s before requesting another OTP`,
        status: 429,
        retryAfterSec,
      };
    }
  }

  const code = isDemoProvider() ? demoCode() : generateNumericOtp(6);
  const codeHash = hashOtpCode(identifier, code);
  const expiresAt = new Date(now + OTP_TTL_MS);

  await OtpChallenge.create({
    identifier,
    codeHash,
    kind: "otp",
    attempts: 0,
    expiresAt,
    consumed: false,
  });

  const demo = isDemoProvider();
  return {
    ok: true,
    demo,
    ...(shouldExposeDemoOtpHint() ? { hint: `Demo OTP is ${code}` } : {}),
  };
}

export async function verifyOtpChallenge(
  identifier: string,
  otp: string,
): Promise<OtpVerifyResult> {
  const challenge = await OtpChallenge.findOne({
    identifier,
    kind: "otp",
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!challenge) {
    return { ok: false, error: "Invalid or expired OTP", status: 401 };
  }

  if ((challenge.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
    challenge.consumed = true;
    await challenge.save();
    return {
      ok: false,
      error: "Too many invalid attempts. Request a new OTP.",
      status: 429,
    };
  }

  const expected = challenge.codeHash || (challenge as { code?: string }).code;
  const incoming = hashOtpCode(identifier, otp);
  const match =
    expected &&
    (otpHashesEqual(expected, incoming) ||
      // legacy plaintext rows (pre-hash migration)
      expected === otp);

  if (!match) {
    challenge.attempts = (challenge.attempts || 0) + 1;
    await challenge.save();
    return { ok: false, error: "Invalid or expired OTP", status: 401 };
  }

  challenge.consumed = true;
  await challenge.save();
  return { ok: true, challengeId: String(challenge._id) };
}

export async function markIdentifierVerified(identifier: string) {
  const token = `verified:${generateNumericOtp(8)}`;
  await OtpChallenge.create({
    identifier,
    codeHash: hashOtpCode(identifier, token),
    kind: "verified",
    attempts: 0,
    expiresAt: new Date(Date.now() + VERIFIED_TTL_MS),
    consumed: false,
  });
}

export async function consumeVerifiedMarker(identifier: string) {
  const marker = await OtpChallenge.findOne({
    identifier,
    kind: "verified",
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!marker) {
    // legacy: code starting with verified:
    const legacy = await OtpChallenge.findOne({
      identifier,
      code: { $regex: /^verified:/ },
      consumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
    if (!legacy) return false;
    legacy.consumed = true;
    await legacy.save();
    return true;
  }

  marker.consumed = true;
  await marker.save();
  return true;
}
