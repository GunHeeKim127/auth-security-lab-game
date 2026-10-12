import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const grouped = await prisma.auditLog.groupBy({
    by: ["mode", "outcome"],
    _count: { _all: true }
  });
  const latest = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 32,
    select: { scenario: true, mode: true, outcome: true, detail: true, createdAt: true }
  });
  return NextResponse.json({ grouped, latest });
}
