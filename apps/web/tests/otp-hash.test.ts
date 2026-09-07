import { createHmac } from "crypto";
import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16";
});

describe("hashOtpCode", () => {
  it("is deterministic HMAC", async () => {
    const { hashOtpCode, otpHashesEqual } = await import("@/lib/server/hash");
    const a = hashOtpCode("parent@demo.com", "000000");
    const b = hashOtpCode("parent@demo.com", "000000");
    const c = hashOtpCode("parent@demo.com", "111111");
    expect(otpHashesEqual(a, b)).toBe(true);
    expect(otpHashesEqual(a, c)).toBe(false);
    expect(a).toHaveLength(64);
  });

  it("matches manual hmac shape", async () => {
    const { hashOtpCode } = await import("@/lib/server/hash");
    const expected = createHmac("sha256", "test-secret-at-least-16")
      .update("a@b.com:123456")
      .digest("hex");
    expect(hashOtpCode("a@b.com", "123456")).toBe(expected);
  });
});
