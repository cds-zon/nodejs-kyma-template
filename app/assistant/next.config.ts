import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ["@mastra/*"],
  /* config options here */
};

export default nextConfig;
