import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, isSecureMode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  if (isSecureMode() && !(await bcrypt.compare(currentPassword, auth.user.passwordHash))) {
    return NextResponse.json({ error: "Current password required" }, { status: 403 });
  }
  if (isSecureMode() && (password.length < 15 || /password|123456|qwerty/i.test(password))) {
    return NextResponse.json({ error: "Password policy violation" }, { status: 422 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  if (isSecureMode()) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: auth.user.id }, data: { passwordHash } }),
      prisma.session.updateMany({ where: { userId: auth.user.id, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
  } else {
    await prisma.user.update({ where: { id: auth.user.id }, data: { passwordHash } });
  }
  return NextResponse.json({ changed: true, sessionsRevoked: isSecureMode() });
}
