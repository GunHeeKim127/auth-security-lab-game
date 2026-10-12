import { NextRequest, NextResponse } from "next/server";
import { authenticate, isSecureMode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function context(request: NextRequest, params: Promise<{ id: string }>) {
  const auth = await authenticate(request);
  if (!auth) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (isSecureMode() && resource.ownerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { auth, resource };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const value = await context(request, params);
  if ("error" in value) return value.error;
  return NextResponse.json({ resource: value.resource });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const value = await context(request, params);
  if ("error" in value) return value.error;
  const body = await request.json().catch(() => ({}));
  const resource = await prisma.resource.update({ where: { id: value.resource.id }, data: { title: String(body.title ?? value.resource.title) } });
  return NextResponse.json({ resource });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const value = await context(request, params);
  if ("error" in value) return value.error;
  await prisma.resource.delete({ where: { id: value.resource.id } });
  return NextResponse.json({ deleted: true });
}
