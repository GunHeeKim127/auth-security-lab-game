import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const key = () => {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(process.env.AUTH_SECRET);
};

export async function POST() {
  const token = await new SignJWT({ role: "USER" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("auth-security-lab")
    .setAudience("auth-security-lab-client")
    .setSubject("alice@lab.local")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(key());
  return NextResponse.json({ token });
}
