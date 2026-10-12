import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const playwright = JSON.parse(await readFile(resolve("test-results", "results.json"), "utf8"));
const database = JSON.parse(await readFile(resolve("results", "db-verification.json"), "utf8"));
const summary = {
  generatedAt: new Date().toISOString(),
  testRun: {
    expected: playwright.stats.expected,
    unexpected: playwright.stats.unexpected,
    flaky: playwright.stats.flaky,
    skipped: playwright.stats.skipped,
    durationMs: playwright.stats.duration
  },
  databaseSnapshot: database,
  scope: {
    simulatedComparisons: 32,
    integrationAndControlTests: playwright.stats.expected - 32,
    projects: ["vulnerable", "secure"]
  }
};

await mkdir(resolve("results"), { recursive: true });
const outputPath = resolve("results", "latest-test-summary.json");
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`Saved: ${outputPath}`);
