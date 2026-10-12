import { NextRequest, NextResponse } from "next/server";
import { authenticate, isSecureMode } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isSecureMode() && auth.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ adminAction: "allowed", actorRole: auth.user.role });
}
