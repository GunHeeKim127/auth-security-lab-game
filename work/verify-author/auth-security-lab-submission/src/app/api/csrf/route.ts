import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export function GET() {
  const token = randomBytes(24).toString("hex");
  const response = NextResponse.json({ token });
  response.cookies.set("lab_csrf", token, { httpOnly: false, sameSite: "strict", path: "/" });
  return response;
}
