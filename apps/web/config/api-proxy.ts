/**
 * Local UI → remote API proxy (LOCAL DEV ONLY).
 *
 * Used by `next.config.ts` rewrites so browser calls stay same-origin:
 *   http://localhost:3000/api/*  →  <target>/api/*
 *
 * Safety:
 *   - Never active when NODE_ENV=production (next build / next start / deploy)
 *   - Never active when APP_ENV is production or staging
 *   - Production deployments are unchanged — they serve their own `/api/*`
 *
 * Local toggle:
 *   config: enabled + target below
 *   or .env.local: API_PROXY_TARGET=https://…
 *   force off: API_PROXY_ENABLED=false
 *
 * Restart `npm run dev` after changes. Do not put API_PROXY_* in production env.
 */
export const apiProxyConfig = {
  /**
   * Master switch for local `next dev` only.
   * When false, proxy is off unless `API_PROXY_TARGET` is set in .env.local.
   */
  enabled: true,

  /** Remote API origin for local debugging (no trailing slash). */
  target: "https://schconnectai.3techpillar.com",
} as const;

export type ApiProxyConfig = typeof apiProxyConfig;

function isDeployedEnv(env: NodeJS.ProcessEnv): boolean {
  const nodeEnv = (env.NODE_ENV || "").toLowerCase();
  const appEnv = (
    env.APP_ENV ||
    env.NEXT_PUBLIC_APP_ENV ||
    ""
  ).toLowerCase();

  // `next build` / `next start` / hosted deploys
  if (nodeEnv === "production") return true;
  // Explicit non-local app envs
  if (appEnv === "production" || appEnv === "staging") return true;
  return false;
}

/** Resolve effective proxy target for Next rewrites (null = disabled). */
export function resolveApiProxyTarget(env: NodeJS.ProcessEnv = process.env): {
  target: string | null;
  source: "env" | "config" | "off";
} {
  // Hard lock — production/staging deploys never proxy, regardless of env vars.
  if (isDeployedEnv(env)) {
    return { target: null, source: "off" };
  }

  if ((env.API_PROXY_ENABLED || "").toLowerCase() === "false") {
    return { target: null, source: "off" };
  }

  const fromEnv = (env.API_PROXY_TARGET || "").trim().replace(/\/$/, "");
  if (fromEnv) {
    return { target: fromEnv, source: "env" };
  }

  if (apiProxyConfig.enabled && apiProxyConfig.target) {
    return {
      target: apiProxyConfig.target.replace(/\/$/, ""),
      source: "config",
    };
  }

  return { target: null, source: "off" };
}
