import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { isSecureMode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const weak = (password: string) => password.length < 15 || /password|123456|qwerty/i.test(password);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  if (isSecureMode() && weak(password)) return NextResponse.json({ error: "Password policy violation" }, { status: 422 });
  try {
    const user = await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
    return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: isSecureMode() ? "Registration failed" : "Email already exists" }, { status: 409 });
  }
}
