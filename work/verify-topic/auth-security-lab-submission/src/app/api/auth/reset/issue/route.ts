import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase() : "";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ accepted: true });
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { tokenHash: hash(token), userId: user.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }
  });
  return NextResponse.json({ accepted: true, labToken: token });
}
