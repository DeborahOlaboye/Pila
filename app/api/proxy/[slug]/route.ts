import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({ where: { slug } });

  if (!skill || skill.status !== "LIVE" || !skill.port) {
    return NextResponse.json({ error: "Skill not found or not running" }, { status: 404 });
  }

  const start = Date.now();
  const body = await req.text();

  // Forward Content-Type and X-PAYMENT (x402) from the caller to the skill server
  const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const xPayment = req.headers.get("x-payment") ?? req.headers.get("X-PAYMENT");
  if (xPayment) forwardHeaders["X-PAYMENT"] = xPayment;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`http://localhost:${skill.port}/run`, {
      method: "POST",
      headers: forwardHeaders,
      body,
    });
  } catch {
    return NextResponse.json({ error: "Skill process is not running. Redeploy from your Dashboard." }, { status: 503 });
  }

  const duration = Date.now() - start;

  // ── x402: skill requires payment ─────────────────────────────────────────
  // Pass the 402 response body (payment requirements) straight back to the
  // caller so they can sign a payment and retry with X-PAYMENT.
  if (upstreamRes.status === 402) {
    const requirementsBody = await upstreamRes.text();
    return new NextResponse(requirementsBody, {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
      },
    });
  }

  // ── Successful paid call ─────────────────────────────────────────────────
  const success = upstreamRes.status === 200;

  // Propagate X-PAYMENT-RESPONSE from skill server back to the caller
  const xPaymentResponse = upstreamRes.headers.get("X-PAYMENT-RESPONSE");

  // Log the call and update skill stats (fire-and-forget)
  prisma.skillCall
    .create({ data: { skillId: skill.id, paidUsd: success ? skill.priceUsd : 0, success, durationMs: duration } })
    .then(() => {
      if (success) {
        return prisma.skill.update({
          where: { id: skill.id },
          data: { totalCalls: { increment: 1 }, totalEarned: { increment: skill.priceUsd }, lastCalledAt: new Date() },
        });
      }
    })
    .catch(() => {});

  const responseText = await upstreamRes.text();
  const resHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (xPaymentResponse) resHeaders["X-PAYMENT-RESPONSE"] = xPaymentResponse;

  return new NextResponse(responseText, { status: upstreamRes.status, headers: resHeaders });
}
