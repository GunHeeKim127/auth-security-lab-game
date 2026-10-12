import { decodeJwt, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { isSecureMode } from "@/lib/auth";

const key = () => {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(process.env.AUTH_SECRET);
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.token !== "string") return NextResponse.json({ error: "Token required" }, { status: 400 });
  try {
    const payload = isSecureMode()
      ? (await jwtVerify(body.token, key(), { algorithms: ["HS256"], issuer: "auth-security-lab", audience: "auth-security-lab-client" })).payload
      : decodeJwt(body.token);
    return NextResponse.json({ valid: true, subject: payload.sub ?? null });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 401 });
  }
}
