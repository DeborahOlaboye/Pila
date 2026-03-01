import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug: slug },
  });

  if (!skill || skill.status !== "LIVE" || !skill.port) {
    return NextResponse.json(
      { error: "Skill not found or not running" },
      { status: 404 }
    );
  }

  const start = Date.now();
  const body = await req.text();

  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const payment = req.headers.get("x-payment");
  if (payment) forwardHeaders["X-PAYMENT"] = payment;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`http://localhost:${skill.port}/run`, {
      method: "POST",
      headers: forwardHeaders,
      body,
    });
  } catch {
    return NextResponse.json({ error: "Skill unreachable" }, { status: 503 });
  }

  const duration = Date.now() - start;
  const success = upstreamRes.status === 200;

  prisma.skillCall
    .create({
      data: { skillId: skill.id, paidUsd: success ? skill.priceUsd : 0, success, durationMs: duration },
    })
    .then(() => {
      if (success) {
        prisma.skill.update({
          where: { id: skill.id },
          data: {
            totalCalls: { increment: 1 },
            totalEarned: { increment: skill.priceUsd },
            lastCalledAt: new Date(),
          },
        });
      }
    });

  const responseText = await upstreamRes.text();
  return new NextResponse(responseText, {
    status: upstreamRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
