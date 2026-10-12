import { NextRequest, NextResponse } from "next/server";
import { runAttack } from "@/lib/lab";
import { scenarioById } from "@/lib/scenarios";
import { prisma } from "@/lib/prisma";
import { currentLabMode, isScenarioHardened } from "@/lib/lab-mode";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const scenario = scenarioById.get(id);
  if (!scenario) return NextResponse.json({ error: "unknown scenario" }, { status: 404 });
  const input = await request.json().catch(() => ({}));
  const mode = currentLabMode();
  const result = runAttack(id, isScenarioHardened(mode, id), input);
  const audit = await prisma.auditLog.create({
    data: {
      scenario: id,
      mode,
      outcome: result.attackSucceeded ? "ATTACK_SUCCEEDED" : "ATTACK_BLOCKED",
      detail: { status: result.status, evidence: result.evidence, control: result.control }
    },
    select: { id: true, createdAt: true }
  });
  return NextResponse.json({ scenario, mode, ...result, audit }, { status: result.status });
}
