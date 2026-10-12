import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir:
    process.env.LAB_MODE === "secure"
      ? ".next-secure"
      : process.env.LAB_MODE === "auth-authz-only"
        ? ".next-auth-authz-only"
        : ".next-vulnerable",
};

export default nextConfig;
