import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: {
      id: true, name: true, slug: true, description: true, category: true,
      priceUsd: true, totalCalls: true, totalEarned: true, status: true,
      endpointUrl: true, walletAddress: true, tags: true, inputSchema: true,
      outputSchema: true, handlerCode: true, createdAt: true, updatedAt: true,
      user: { select: { address: true } },
    },
  });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(skill);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skill = await prisma.skill.findUnique({ where: { id: skillId }, include: { user: true } });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (skill.user.address !== session.user.name.toLowerCase())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const priceUsd = typeof body.priceUsd === "number" ? body.priceUsd : parseFloat(body.priceUsd);
  if (isNaN(priceUsd) || priceUsd <= 0)
    return NextResponse.json({ error: "priceUsd must be a positive number" }, { status: 400 });

  const updated = await prisma.skill.update({ where: { id: skillId }, data: { priceUsd } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { user: true },
  });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (skill.user.address !== session.user.name.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.skill.delete({ where: { id: skillId } });
  return NextResponse.json({ ok: true });
}
