import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId } = await req.json();
  const address = session.user.name.toLowerCase();

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, user: { address } },
  });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Simulate withdrawal — in production, transfer from skill wallet to user wallet
  const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  return NextResponse.json({
    ok: true,
    amount: skill.totalEarned,
    txHash,
    to: address,
  });
}
