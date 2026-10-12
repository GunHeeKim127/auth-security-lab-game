import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession, isSecureMode, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const attempts = new Map<string, { count: number; first: number }>();
const sourceAttempts = new Map<string, { count: number; first: number }>();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const secure = isSecureMode();
  const source = request.headers.get("x-forwarded-for") ?? "local";
  const key = `${source}:${email}`;
  const state = attempts.get(key) ?? { count: 0, first: Date.now() };
  const sourceState = sourceAttempts.get(source) ?? { count: 0, first: Date.now() };

  if (secure && ((state.count >= 5 && Date.now() - state.first < 60_000) || (sourceState.count >= 10 && Date.now() - sourceState.first < 60_000))) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    attempts.set(key, { count: state.count + 1, first: state.first });
    sourceAttempts.set(source, { count: sourceState.count + 1, first: sourceState.first });
    const error = secure ? "Invalid email or password" : user ? "Incorrect password" : "Account not found";
    return NextResponse.json({ error }, { status: 401 });
  }

  attempts.delete(key);
  const requestedToken = request.headers.get("x-fixed-session");
  const { token, session } = await createSession(user.id, requestedToken);
  const response = NextResponse.json({ user: { id: user.id, email: user.email, role: user.role }, sessionId: session.id });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: secure,
    secure,
    sameSite: secure ? "strict" : "none",
    path: "/",
    maxAge: 3600
  });
  return response;
}
