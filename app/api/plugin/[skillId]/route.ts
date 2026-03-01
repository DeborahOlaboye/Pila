import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOpenClawPlugin } from "@/lib/plugin-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
  });
  if (!skill || !skill.endpointUrl) {
    return NextResponse.json({ error: "Not found or not deployed" }, { status: 404 });
  }

  const plugin = generateOpenClawPlugin({
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    endpointUrl: skill.endpointUrl,
    priceUsd: skill.priceUsd,
    inputSchema: skill.inputSchema as Record<string, string>,
  });

  return new NextResponse(JSON.stringify(plugin, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="openclaw.plugin.json"`,
    },
  });
}
