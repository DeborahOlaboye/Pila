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
