import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "game.spec.ts",
  fullyParallel: false,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3010",
    channel: "msedge",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npx next dev -p 3010",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});


