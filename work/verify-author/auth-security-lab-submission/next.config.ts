import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.LAB_MODE === "secure" ? ".next-secure" : ".next-vulnerable",
};

export default nextConfig;
