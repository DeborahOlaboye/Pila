import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [skillCount, earningsResult, callCount] = await Promise.all([
    prisma.skill.count({ where: { status: "LIVE" } }),
    prisma.skill.aggregate({ _sum: { totalEarned: true } }),
    prisma.skill.aggregate({ _sum: { totalCalls: true } }),
  ]);

  return NextResponse.json({
    skills: skillCount,
    earned: earningsResult._sum.totalEarned ?? 0,
    calls: callCount._sum.totalCalls ?? 0,
  });
}
