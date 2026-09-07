export type AppEnv = "development" | "staging" | "production";

export type SharedAppConfigInput = {
  env?: string;
  name?: string;
  url?: string;
  demoMode?: boolean | string;
  demoOtp?: string;
  apiProxyConfigured?: boolean;
};

function normalizeEnv(value?: string): AppEnv {
  if (value === "staging" || value === "production" || value === "development") {
    return value;
  }
  return "development";
}

/** Platform-agnostic config factory — web/mobile inject env values. */
export function createAppConfig(input: SharedAppConfigInput = {}) {
  const env = normalizeEnv(input.env);
  const demoMode =
    typeof input.demoMode === "boolean"
      ? input.demoMode
      : String(input.demoMode ?? "true") === "true";

  return {
    env,
    name: input.name || "SchoolConnect AI",
    url: input.url || "http://localhost:3000",
    demoMode,
    demoOtp: input.demoOtp || "000000",
    isProd: env === "production",
    isStaging: env === "staging",
    isDev: env === "development",
    apiProxyConfigured: Boolean(input.apiProxyConfigured),
  } as const;
}
