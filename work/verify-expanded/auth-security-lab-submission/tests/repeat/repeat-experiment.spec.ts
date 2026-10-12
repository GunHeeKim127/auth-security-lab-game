import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { scenarios } from "../../src/lib/scenarios";

const attackInputs: Record<string, object> = {
  "AUTH-01": { accountExists: true },
  "AUTH-02": { attempt: 20 },
  "AUTH-03": { password: "password123" },
  "AUTH-04": { attempt: 20 },
  "SESS-01": { sessionBefore: "fixed-session", sessionAfter: "fixed-session" },
  "SESS-02": { cookieFlags: [] },
  "SESS-03": { tokenRevoked: true },
  "SESS-04": { expired: true },
  "AUTHZ-01": { actorId: "attacker", ownerId: "victim" },
  "AUTHZ-02": { role: "USER" },
  "AUTHZ-03": { actorId: "attacker", ownerId: "victim" },
  "AUTHZ-04": { actorId: "attacker", ownerId: "victim" },
  "TOKEN-01": { algorithm: "none" },
  "TOKEN-02": { tokenIssuedBeforePasswordChange: true },
  "FLOW-01": { resetTokenUsed: true },
  "FLOW-02": { origin: "https://attacker.invalid", expectedOrigin: "http://localhost:3002" }
};

type Observation = {
  repetition: number;
  scenarioId: string;
  category: string;
  mode: "vulnerable" | "secure";
  attackSucceeded: boolean;
  status: number;
  durationMs: number;
  evidence: string;
  control: string;
  observedAt: string;
};

const round = (value: number) => Math.round(value * 100) / 100;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

test("동일한 16개 공격을 두 모드에서 10회 반복해 원자료를 저장한다", async ({ playwright }) => {
  test.setTimeout(180_000);
  const contexts = {
    vulnerable: await playwright.request.newContext({ baseURL: "http://127.0.0.1:3001" }),
    secure: await playwright.request.newContext({ baseURL: "http://127.0.0.1:3002" })
  };
  const observations: Observation[] = [];

  try {
    for (let repetition = 1; repetition <= 10; repetition += 1) {
      for (const scenario of scenarios) {
        const modes = repetition % 2 === 1 ? (["vulnerable", "secure"] as const) : (["secure", "vulnerable"] as const);
        for (const mode of modes) {
          const started = performance.now();
          const response = await contexts[mode].post(`/api/lab/${scenario.id}`, { data: attackInputs[scenario.id] });
          const durationMs = round(performance.now() - started);
          const body = await response.json();
          expect(body.scenario.id).toBe(scenario.id);
          expect(body.mode).toBe(mode);
          observations.push({
            repetition,
            scenarioId: scenario.id,
            category: scenario.category,
            mode,
            attackSucceeded: body.attackSucceeded,
            status: body.status,
            durationMs,
            evidence: body.evidence,
            control: body.control,
            observedAt: new Date().toISOString()
          });
        }
      }
    }
  } finally {
    await contexts.vulnerable.dispose();
    await contexts.secure.dispose();
  }

  expect(observations).toHaveLength(320);
  const modes = (["vulnerable", "secure"] as const).map((mode) => {
    const rows = observations.filter((row) => row.mode === mode);
    const durations = rows.map((row) => row.durationMs);
    const successes = rows.filter((row) => row.attackSucceeded).length;
    return {
      mode,
      observations: rows.length,
      attackSuccessCount: successes,
      attackBlockedCount: rows.length - successes,
      attackSuccessRatePercent: round((successes / rows.length) * 100),
      responseTimeMs: {
        mean: round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
        median: round(median(durations)),
        min: round(Math.min(...durations)),
        max: round(Math.max(...durations))
      }
    };
  });
  const byScenario = scenarios.map((scenario) => ({
    scenarioId: scenario.id,
    category: scenario.category,
    vulnerableSuccesses: observations.filter((row) => row.scenarioId === scenario.id && row.mode === "vulnerable" && row.attackSucceeded).length,
    secureSuccesses: observations.filter((row) => row.scenarioId === scenario.id && row.mode === "secure" && row.attackSucceeded).length,
    repetitions: 10
  }));
  const summary = {
    generatedAt: new Date().toISOString(),
    design: {
      repetitions: 10,
      scenarios: scenarios.length,
      modes: 2,
      expectedObservations: 320,
      actualObservations: observations.length,
      orderControl: "홀수 회차는 vulnerable→secure, 짝수 회차는 secure→vulnerable 순으로 교대"
    },
    modes,
    byScenario
  };
  const outputDir = path.resolve("results");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "repeated-experiment-raw.json"), `${JSON.stringify({ metadata: summary.design, observations }, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "repeated-experiment-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  expect(modes.find((item) => item.mode === "vulnerable")?.attackSuccessRatePercent).toBe(100);
  expect(modes.find((item) => item.mode === "secure")?.attackSuccessRatePercent).toBe(0);
});
