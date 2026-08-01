import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { getOtpPepper } from "@/lib/server/secrets";

export function hashOtpCode(identifier: string, code: string): string {
  return createHmac("sha256", getOtpPepper())
    .update(`${identifier.toLowerCase().trim()}:${code.trim()}`)
    .digest("hex");
}

export function otpHashesEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits;
  const n = randomInt(0, max);
  return String(n).padStart(digits, "0");
}
