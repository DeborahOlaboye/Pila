import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { stopSkill } from "@/lib/deploy";

export async function POST(
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

  stopSkill(skill.id);

  const updated = await prisma.skill.update({
    where: { id: skillId },
    data: { status: "STOPPED" },
  });

  return NextResponse.json(updated);
}
