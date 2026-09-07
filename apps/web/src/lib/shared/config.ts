import {
  createAppConfig,
  type AppEnv,
} from "@schoolconnect/shared";

export type { AppEnv };

export const appConfig = createAppConfig({
  env:
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    "development",
  name: process.env.NEXT_PUBLIC_APP_NAME || "SchoolConnect AI",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE || "true",
  demoOtp: process.env.NEXT_PUBLIC_DEMO_OTP || "000000",
  apiProxyConfigured: Boolean(
    process.env.NODE_ENV !== "production" &&
      ((process.env.API_PROXY_TARGET || "").trim() ||
        process.env.API_PROXY_ENABLED === "true"),
  ),
});
