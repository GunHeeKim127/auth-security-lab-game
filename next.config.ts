import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir:
    process.env.LAB_MODE === "secure"
      ? ".next-game-secure"
      : process.env.LAB_MODE === "auth-authz-only"
        ? ".next-game-auth-authz-only"
        : ".next-game",
};

export default nextConfig;
