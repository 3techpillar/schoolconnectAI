import type { NextConfig } from "next";
import { resolveApiProxyTarget } from "./config/api-proxy";

const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";

/**
 * Local-dev only: rewrite `/api/*` to a remote host.
 * Production/staging builds always get `[]` (see `resolveApiProxyTarget`).
 */
function apiProxyRewrites() {
  const { target, source } = resolveApiProxyTarget();
  if (!target) return [];

  console.info(
    `[next.config] Local API proxy: /api/* → ${target}/api/* (via ${source})`,
  );
  return [
    {
      source: "/api/:path*",
      destination: `${target}/api/:path*`,
    },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@schoolconnect/shared"],
  env: {
    APP_ENV: appEnv,
  },
  async rewrites() {
    return apiProxyRewrites();
  },
};

export default nextConfig;
