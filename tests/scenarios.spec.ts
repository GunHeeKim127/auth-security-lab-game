import { expect, test } from "@playwright/test";
import { scenarios } from "../src/lib/scenarios";

const attackInputs: Record<string, object> = {
  "AUTH-01": { accountExists: true }, "AUTH-02": { attempt: 20 }, "AUTH-03": { password: "password123" },
  "AUTH-04": { attempt: 30 }, "SESS-01": { sessionBefore: "fixed-session", sessionAfter: "fixed-session" },
  "SESS-02": { cookieFlags: [] }, "SESS-03": { tokenRevoked: true }, "SESS-04": { expired: true },
  "AUTHZ-01": { actorId: "user-a", ownerId: "user-b" }, "AUTHZ-02": { role: "USER" },
  "AUTHZ-03": { actorId: "user-a", ownerId: "user-b" }, "AUTHZ-04": { actorId: "user-a", ownerId: "user-b" },
  "TOKEN-01": { algorithm: "none" }, "TOKEN-02": { tokenIssuedBeforePasswordChange: true },
  "FLOW-01": { resetTokenUsed: true }, "FLOW-02": { origin: "https://attacker.invalid", expectedOrigin: "http://127.0.0.1" }
};

for (const scenario of scenarios) {
  test(`${scenario.id}: ${scenario.title}`, async ({ request }, testInfo) => {
    const response = await request.post(`/api/lab/${scenario.id}`, { data: attackInputs[scenario.id] });
    const body = await response.json();
    const vulnerable = testInfo.project.name === "vulnerable";
    expect(body.mode).toBe(vulnerable ? "vulnerable" : "secure");
    expect(body.attackSucceeded).toBe(vulnerable);
    await testInfo.attach("experiment-result", { body: JSON.stringify({ id: scenario.id, category: scenario.category, attack: scenario.attack, defense: scenario.defense, result: body }, null, 2), contentType: "application/json" });
  });
}
