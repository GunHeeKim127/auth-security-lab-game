export type LabMode = "vulnerable" | "auth-authz-only" | "secure";

export function currentLabMode(): LabMode {
  if (process.env.LAB_MODE === "secure") return "secure";
  if (process.env.LAB_MODE === "auth-authz-only") return "auth-authz-only";
  return "vulnerable";
}

export function isScenarioHardened(mode: LabMode, scenarioId: string) {
  if (mode === "secure") return true;
  if (mode === "auth-authz-only") {
    return scenarioId.startsWith("AUTH-") || scenarioId.startsWith("AUTHZ-");
  }
  return false;
}
