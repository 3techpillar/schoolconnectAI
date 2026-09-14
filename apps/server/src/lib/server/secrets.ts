/**
 * Auth signing secret — never fall back to Mongo URI.
 * Import only from server routes / server modules.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET is required (min 16 chars). Set it in .env — do not reuse MONGO_URI.",
    );
  }
  return new TextEncoder().encode(secret.slice(0, 64).padEnd(64, "0"));
}

/** Pepper for OTP hashing (same secret family as JWT). */
export function getOtpPepper(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is required for OTP hashing");
  }
  return secret;
}
