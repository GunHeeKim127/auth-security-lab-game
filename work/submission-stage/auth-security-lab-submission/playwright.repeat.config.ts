import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/repeat",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  projects: [{ name: "ten-repetition-experiment" }],
  webServer: [
    { command: "npm run dev", url: "http://127.0.0.1:3001/api/health", reuseExistingServer: true, timeout: 120_000 },
    { command: "npm run dev:secure", url: "http://127.0.0.1:3002/api/health", reuseExistingServer: true, timeout: 120_000 },
    { command: "npm run dev:auth-authz-only", url: "http://127.0.0.1:3003/api/health", reuseExistingServer: true, timeout: 120_000 }
  ]
});
