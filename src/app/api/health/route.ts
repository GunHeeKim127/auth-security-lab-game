import { NextResponse } from "next/server";
import { currentLabMode } from "@/lib/lab-mode";

export function GET() {
  return NextResponse.json({ ok: true, mode: currentLabMode() });
}
