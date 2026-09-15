import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many OTP requests from this IP, please try again after 15 minutes" }
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests, please try again later." }
});
