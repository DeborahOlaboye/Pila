import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const mine = searchParams.get("mine");
  const session = await getServerSession(authOptions);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (mine && session?.user?.name) {
    where.user = { address: session.user.name.toLowerCase() };
  } else {
    where.status = "LIVE";
  }
  if (category && category !== "ALL") where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const skills = await prisma.skill.findMany({
      where,
      orderBy: { totalCalls: "desc" },
      select: {
        id: true, name: true, slug: true, description: true,
        category: true, priceUsd: true, totalCalls: true,
        totalEarned: true, status: true, endpointUrl: true,
        createdAt: true, walletAddress: true, tags: true,
        inputSchema: true, outputSchema: true,
      },
    });
    return NextResponse.json(skills);
  } catch (err) {
    console.error("[GET /api/skills] DB error:", err);
    return NextResponse.json({ error: "Database unavailable. Please try again shortly." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(10),
  category: z.enum(["DATA","FINANCE","AI","UTILITY","SOCIAL","DEVELOPER","CUSTOM"]).default("CUSTOM"),
  tags: z.array(z.string()).default([]),
  priceUsd: z.number().positive().max(100),
  inputSchema: z.record(z.string()),
  outputSchema: z.record(z.string()),
  handlerCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const user = await prisma.user.upsert({
    where: { address: session.user.name.toLowerCase() },
    create: { address: session.user.name.toLowerCase() },
    update: {},
  });

  const slug =
    data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").substring(0, 50) +
    "-" + Date.now().toString(36);

  const skill = await prisma.skill.create({
    data: {
      userId: user.id,
      name: data.name,
      slug,
      description: data.description,
      category: data.category,
      tags: data.tags,
      priceUsd: data.priceUsd,
      inputSchema: data.inputSchema,
      outputSchema: data.outputSchema,
      handlerCode: data.handlerCode,
    },
  });

  return NextResponse.json(skill, { status: 201 });
}
