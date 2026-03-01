import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Zap, Clock, TrendingUp, Activity } from "lucide-react";
import { TestSkillPanel } from "@/components/TestSkillPanel";
import { SDKSnippet } from "@/components/SDKSnippet";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

async function getSkill(id: string) {
  try {
    return await prisma.skill.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, description: true, category: true,
        priceUsd: true, totalCalls: true, totalEarned: true, status: true,
        endpointUrl: true, walletAddress: true, tags: true, inputSchema: true,
        outputSchema: true, handlerCode: true, createdAt: true, updatedAt: true,
        user: { select: { address: true } },
      },
    });
  } catch { return null; }
}

async function getMetrics(id: string) {
  try {
    const [skill, calls] = await Promise.all([
      prisma.skill.findUnique({
        where: { id },
        select: { totalCalls: true, totalEarned: true },
      }),
      prisma.skillCall.findMany({
        where: { skillId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { durationMs: true },
      }),
    ]);
    if (!skill) return { totalCalls: 0, totalEarned: 0, avgLatency: 0 };
    const avgLatency = calls.length > 0
      ? Math.round(calls.reduce((s, c) => s + c.durationMs, 0) / calls.length)
      : 0;
    return { totalCalls: skill.totalCalls, totalEarned: skill.totalEarned, avgLatency };
  } catch { return { totalCalls: 0, totalEarned: 0, avgLatency: 0 }; }
}

export default async function SkillDetailPage({ params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = await params;
  const [skill, metrics] = await Promise.all([
    getSkill(skillId),
    getMetrics(skillId),
  ]);

  if (!skill) notFound();

  const isLive = skill.status === "LIVE";
  const statusColor = skill.status === "LIVE" ? "#10B981" : skill.status === "STOPPED" ? "#EF4444" : "#F59E0B";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      {/* Back */}
      <Link href="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6B7280", fontSize: 14, textDecoration: "none", marginBottom: 32 }}>
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 40 }}>{CATEGORY_ICONS[skill.category] || "✨"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#F9FAFB", letterSpacing: "-0.02em" }}>{skill.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: `${statusColor}18`, border: `1px solid ${statusColor}40` }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor }} />
                <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{skill.status}</span>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", fontSize: 12, color: "#8B5CF6" }}>
                {CATEGORY_LABELS[skill.category]}
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 15, color: "#9CA3AF", lineHeight: 1.6 }}>{skill.description}</p>
            <div style={{ fontSize: 13, color: "#4B5563", fontFamily: "monospace" }}>
              by {skill.user?.address?.slice(0, 6)}...{skill.user?.address?.slice(-4)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>
              ${skill.priceUsd.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>USDC per call</div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 32, padding: "20px 24px", borderRadius: 12, background: "#1A1A1F", border: "1px solid #2A2A35", marginBottom: 32, flexWrap: "wrap" }}>
        {[
          { icon: Zap, label: "Total Calls", value: metrics.totalCalls?.toLocaleString() || "0", color: "#8B5CF6" },
          { icon: TrendingUp, label: "Total Earned", value: `$${(metrics.totalEarned || 0).toFixed(4)}`, color: "#10B981" },
          { icon: Clock, label: "Avg Latency", value: `${metrics.avgLatency || 0}ms`, color: "#F59E0B" },
          { icon: Activity, label: "Status", value: skill.status, color: statusColor },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon size={16} style={{ color }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color, fontFamily: "JetBrains Mono, monospace" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left: Test panel */}
        <div style={{ background: "#1A1A1F", borderRadius: 16, padding: 24, border: "1px solid #2A2A35" }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 600, color: "#F9FAFB" }}>Live Test Panel</h2>
          {isLive ? (
            <TestSkillPanel slug={skill.slug} priceUsd={skill.priceUsd} inputSchema={(skill.inputSchema || {}) as Record<string, string>} />
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "#4B5563", background: "#111827", borderRadius: 10 }}>
              <Activity size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Skill is not currently live</p>
            </div>
          )}
        </div>

        {/* Right: SDK + Plugin */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#1A1A1F", borderRadius: 16, padding: 24, border: "1px solid #2A2A35" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: "#F9FAFB" }}>SDK Snippet</h2>
            <SDKSnippet slug={skill.slug} endpointUrl={skill.endpointUrl || ""} inputSchema={(skill.inputSchema || {}) as Record<string, string>} />
          </div>

          <div style={{ background: "#1A1A1F", borderRadius: 16, padding: 24, border: "1px solid #2A2A35" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600, color: "#F9FAFB" }}>OpenClaw Integration</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
              Add this skill to any OpenClaw agent with one command.
            </p>
            <div style={{ padding: 12, borderRadius: 8, background: "#111827", border: "1px solid #1F2937", fontFamily: "monospace", fontSize: 13, color: "#8B5CF6", marginBottom: 14 }}>
              clawhub install {skill.slug}
            </div>
            {isLive && (
              <a
                href={`/api/plugin/${skill.id}`}
                download="openclaw.plugin.json"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#8B5CF6", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                <Download size={14} /> Download openclaw.plugin.json
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
