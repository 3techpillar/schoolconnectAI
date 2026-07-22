import type { NextConfig } from "next";

const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    APP_ENV: appEnv,
  },
};

export default nextConfig;
