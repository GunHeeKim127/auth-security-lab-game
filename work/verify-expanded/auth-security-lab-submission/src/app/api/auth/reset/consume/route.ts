import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { isSecureMode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record) return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
  if (isSecureMode() && (record.usedAt || record.expiresAt <= new Date())) {
    return NextResponse.json({ error: "Reset token expired or used" }, { status: 410 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  if (isSecureMode()) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
  } else {
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
  }
  return NextResponse.json({ changed: true });
}
