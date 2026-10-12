import { NextRequest, NextResponse } from "next/server";
import { authenticate, isSecureMode } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isSecureMode()) {
    const origin = request.headers.get("origin");
    const current = new URL(request.url);
    const allowedOrigins = new Set([current.origin, `http://127.0.0.1:${current.port}`, `http://localhost:${current.port}`]);
    const cookieTokens = request.cookies.getAll("lab_csrf").map((cookie) => cookie.value);
    const headerToken = request.headers.get("x-csrf-token");
    if (!origin || !allowedOrigins.has(origin) || !headerToken || !cookieTokens.includes(headerToken)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ updated: true, displayName: String(body.displayName ?? "") });
}
