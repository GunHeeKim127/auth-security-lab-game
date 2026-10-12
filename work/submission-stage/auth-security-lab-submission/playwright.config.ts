import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/repeat/**",
  fullyParallel: false,
  reporter: [["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", ...devices["Desktop Chrome"] },
  projects: [
    { name: "vulnerable", use: { baseURL: "http://127.0.0.1:3001" } },
    { name: "secure", use: { baseURL: "http://127.0.0.1:3002" } }
  ],
  webServer: [
    { command: "npm run dev", url: "http://127.0.0.1:3001/api/health", reuseExistingServer: true, timeout: 120_000 },
    { command: "npm run dev:secure", url: "http://127.0.0.1:3002/api/health", reuseExistingServer: true, timeout: 120_000 }
  ]
});
