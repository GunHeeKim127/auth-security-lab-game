import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "lab_session";

export const isSecureMode = () => process.env.LAB_MODE === "secure";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readSessionToken(request: NextRequest) {
  return request.headers.get("x-session-token") ?? request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

export async function createSession(userId: string, requestedToken?: string | null) {
  const token = !isSecureMode() && requestedToken ? requestedToken : randomBytes(32).toString("hex");
  const session = await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return { token, session };
}

export async function authenticate(request: NextRequest) {
  const token = readSessionToken(request);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!session) return null;
  if (isSecureMode() && (session.revokedAt || session.expiresAt <= new Date())) return null;
  return { token, session, user: session.user };
}
