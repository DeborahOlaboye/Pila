import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateHandlerCode } from "@/lib/claude";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  inputSchema: z.record(z.string()),
  outputSchema: z.record(z.string()),
  priceUsd: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const code = await generateHandlerCode(parsed.data);
    return NextResponse.json({ code });
  } catch (err) {
    return NextResponse.json({ error: "Code generation failed", detail: String(err) }, { status: 500 });
  }
}
