import type { NextConfig } from "next";

const devServerActionOrigins =
  process.env.NODE_ENV === "development"
    ? ["localhost:4010", "127.0.0.1:4010", "*.devtunnels.ms"]
    : [];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: devServerActionOrigins,
    },
  },
};

export default nextConfig;
