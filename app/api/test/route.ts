import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { slug, input } = await req.json();

  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill || skill.status !== "LIVE" || !skill.port) {
    return NextResponse.json({ error: "Skill not available" }, { status: 404 });
  }

  const start = Date.now();
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`http://localhost:${skill.port}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input || {}),
    });
  } catch {
    return NextResponse.json({ error: "Skill process is not running. Go to your Dashboard and redeploy the skill." }, { status: 503 });
  }

  const durationMs = Date.now() - start;
  const success = upstreamRes.status === 200;
  const data = await upstreamRes.json();

  // Track call stats (fire and forget)
  prisma.skillCall
    .create({ data: { skillId: skill.id, paidUsd: success ? skill.priceUsd : 0, success, durationMs } })
    .then(() => {
      if (success) {
        prisma.skill.update({
          where: { id: skill.id },
          data: { totalCalls: { increment: 1 }, totalEarned: { increment: skill.priceUsd }, lastCalledAt: new Date() },
        }).catch(() => {});
      }
    })
    .catch(() => {});

  return NextResponse.json({ result: data, latencyMs: durationMs });
}
