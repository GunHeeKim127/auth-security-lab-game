import { NextRequest, NextResponse } from "next/server";
import { authenticate, isSecureMode, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isSecureMode()) {
    await prisma.session.update({ where: { id: auth.session.id }, data: { revokedAt: new Date() } });
  }
  const response = NextResponse.json({ loggedOut: true, revoked: isSecureMode() });
  response.cookies.set(SESSION_COOKIE, "", { expires: new Date(0), path: "/" });
  return response;
}
