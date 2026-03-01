import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const [skill, calls] = await Promise.all([
    prisma.skill.findUnique({
      where: { id: skillId },
      select: { totalCalls: true, totalEarned: true, lastCalledAt: true },
    }),
    prisma.skillCall.findMany({
      where: { skillId: skillId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, paidUsd: true, success: true, durationMs: true, createdAt: true,
      },
    }),
  ]);

  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  type CallRecord = { id: string; paidUsd: number; success: boolean; durationMs: number; createdAt: Date };

  const avgLatency =
    calls.length > 0
      ? Math.round((calls as CallRecord[]).reduce((s, c) => s + c.durationMs, 0) / calls.length)
      : 0;

  // Daily earnings for chart (last 7 days)
  const now = new Date();
  const dailyEarnings: { date: string; earned: number; calls: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayCalls = (calls as CallRecord[]).filter(
      (c) => c.createdAt.toString().startsWith(dateStr)
    );
    dailyEarnings.push({
      date: dateStr,
      earned: dayCalls.filter((c) => c.success).reduce((s: number, c: CallRecord) => s + c.paidUsd, 0),
      calls: dayCalls.length,
    });
  }

  return NextResponse.json({ ...skill, avgLatency, calls, dailyEarnings });
}
