import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { slug, input } = await req.json();

  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill || skill.status !== "LIVE" || !skill.port) {
    return NextResponse.json({ error: "Skill not available" }, { status: 404 });
  }

  const start = Date.now();
  try {
    const res = await fetch(`http://localhost:${skill.port}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input || {}),
    });
    const data = await res.json();
    return NextResponse.json({ result: data, latencyMs: Date.now() - start });
  } catch {
    return NextResponse.json({ error: "Skill process is not running. Go to your Dashboard and redeploy the skill." }, { status: 503 });
  }
}
