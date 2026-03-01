import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deploySkill, stopSkill } from "@/lib/deploy";

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

  // Stop existing process if running
  if (skill.status === "LIVE") {
    stopSkill(skill.id);
  }

  await prisma.skill.update({
    where: { id: skillId },
    data: { status: "DEPLOYING" },
  });

  try {
    const result = await deploySkill({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      handlerCode: skill.handlerCode,
      priceUsd: skill.priceUsd,
      description: skill.description,
    });

    const updated = await prisma.skill.update({
      where: { id: skillId },
      data: {
        status: "LIVE",
        walletAddress: result.walletAddress,
        walletKey: result.encryptedKey,
        port: result.port,
        endpointUrl: result.endpointUrl,
        processId: result.processId,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    await prisma.skill.update({
      where: { id: skillId },
      data: { status: "ERROR" },
    });
    return NextResponse.json(
      { error: "Deployment failed", detail: String(err) },
      { status: 500 }
    );
  }
}
