export type AppEnv = "development" | "staging" | "production";

function readEnv(): AppEnv {
  const value =
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    "development";

  if (value === "staging" || value === "production" || value === "development") {
    return value;
  }
  return "development";
}

export const appConfig = {
  env: readEnv(),
  name: process.env.NEXT_PUBLIC_APP_NAME || "SchoolConnect AI",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  demoMode: (process.env.NEXT_PUBLIC_DEMO_MODE || "true") === "true",
  demoOtp: process.env.NEXT_PUBLIC_DEMO_OTP || "000000",
  isProd: readEnv() === "production",
  isStaging: readEnv() === "staging",
  isDev: readEnv() === "development",
} as const;
