"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Play, Square, Trash2, TrendingUp, Zap, BarChart3, Wallet, ExternalLink } from "lucide-react";
import { EarningsChart } from "@/components/EarningsChart";
import { Skill } from "@/types";

function StatusBadge({ status }: { status: Skill["status"] }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    LIVE: { bg: "rgba(16,185,129,0.15)", text: "#10B981", label: "Live" },
    STOPPED: { bg: "rgba(239,68,68,0.15)", text: "#EF4444", label: "Stopped" },
    DEPLOYING: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B", label: "Deploying" },
    DRAFT: { bg: "rgba(107,114,128,0.15)", text: "#6B7280", label: "Draft" },
    ERROR: { bg: "rgba(239,68,68,0.15)", text: "#EF4444", label: "Error" },
  };
  const c = colors[status] || colors.DRAFT;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 100, background: c.bg, color: c.text, fontSize: 12, fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ date: string; earned: number; calls: number }[]>([]);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    async function load() {
      const res = await fetch("/api/skills?mine=1");
      const data = await res.json();
      setSkills(data);
      setLoading(false);
      // Load chart data from first skill with calls
      const withCalls = data.find((s: Skill) => s.totalCalls > 0);
      if (withCalls) {
        const mRes = await fetch(`/api/skills/${withCalls.id}/metrics`);
        const mData = await mRes.json();
        setChartData(mData.dailyEarnings || []);
      }
    }
    load();
  }, [session]);

  async function handleStop(id: string) {
    await fetch(`/api/skills/${id}/stop`, { method: "POST" });
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, status: "STOPPED" } : s));
  }

  async function handleStart(id: string) {
    await fetch(`/api/skills/${id}/deploy`, { method: "POST" });
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, status: "DEPLOYING" } : s));
    setTimeout(async () => {
      const res = await fetch("/api/skills?mine=1");
      setSkills(await res.json());
    }, 8000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this skill?")) return;
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleWithdraw(id: string) {
    setWithdrawing(id);
    const res = await fetch("/api/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId: id }) });
    const data = await res.json();
    setTxHash(data.txHash);
    setWithdrawing(null);
  }

  const totalEarned = skills.reduce((s, sk) => s + sk.totalEarned, 0);
  const totalCalls = skills.reduce((s, sk) => s + sk.totalCalls, 0);
  const liveCount = skills.filter((s) => s.status === "LIVE").length;

  if (status === "loading" || loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ color: "#6B7280" }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #059669, #10B981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={20} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#F9FAFB", letterSpacing: "-0.02em" }}>Dashboard</h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280", fontFamily: "monospace" }}>
          {session.user?.name?.slice(0, 8)}...{session.user?.name?.slice(-6)}
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { icon: TrendingUp, label: "Total Earned", value: `$${totalEarned.toFixed(4)}`, sub: "USDC on Base", color: "#10B981" },
          { icon: Zap, label: "Total Calls", value: totalCalls.toLocaleString(), sub: "across all skills", color: "#8B5CF6" },
          { icon: Activity, label: "Live Skills", value: String(liveCount), sub: `of ${skills.length} total`, color: "#F59E0B" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} style={{ padding: 24, borderRadius: 16, background: "#1A1A1F", border: "1px solid #2A2A35" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Icon size={16} style={{ color }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#4B5563" }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Earnings chart */}
        <div style={{ background: "#1A1A1F", borderRadius: 16, padding: 24, border: "1px solid #2A2A35" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>Earnings (7 days)</h3>
          <EarningsChart data={chartData} />
        </div>

        {/* Withdraw panel */}
        <div style={{ background: "#1A1A1F", borderRadius: 16, padding: 24, border: "1px solid #2A2A35" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>
            <Wallet size={16} style={{ marginRight: 8, display: "inline", verticalAlign: "middle" }} />
            Withdraw Earnings
          </h3>
          {txHash && (
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6EE7B7", fontSize: 12, fontFamily: "monospace", marginBottom: 16, wordBreak: "break-all" }}>
              ✓ Tx: {txHash.slice(0, 20)}...
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {skills.filter((s) => s.totalEarned > 0).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "#111827", border: "1px solid #1F2937" }}>
                <span style={{ flex: 1, fontSize: 13, color: "#D1D5DB" }}>{s.name}</span>
                <span style={{ fontSize: 13, color: "#10B981", fontFamily: "monospace" }}>${s.totalEarned.toFixed(4)}</span>
                <button
                  onClick={() => handleWithdraw(s.id)}
                  disabled={withdrawing === s.id}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #2A2A35", background: "transparent", color: "#8B5CF6", fontSize: 12, cursor: "pointer" }}
                >
                  {withdrawing === s.id ? "..." : "Withdraw"}
                </button>
              </div>
            ))}
            {skills.filter((s) => s.totalEarned > 0).length === 0 && (
              <p style={{ color: "#4B5563", fontSize: 13, margin: 0 }}>No earnings yet. Deploy a skill to start earning.</p>
            )}
          </div>
        </div>
      </div>

      {/* Skills table */}
      <div style={{ background: "#1A1A1F", borderRadius: 16, border: "1px solid #2A2A35", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #2A2A35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>My Skills</h3>
          <a href="/builder" style={{ fontSize: 13, color: "#8B5CF6", textDecoration: "none", fontWeight: 500 }}>+ Build New</a>
        </div>
        {skills.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#4B5563" }}>
            <p style={{ margin: "0 0 12px", fontSize: 15 }}>No skills yet.</p>
            <a href="/builder" style={{ color: "#8B5CF6", textDecoration: "none", fontSize: 14 }}>Build your first skill →</a>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2A2A35" }}>
                  {["Name", "Status", "Calls", "Earned", "Endpoint", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #1F2937", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 500, color: "#F9FAFB" }}>{s.name}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#D1D5DB", fontFamily: "monospace" }}>{s.totalCalls.toLocaleString()}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#10B981", fontFamily: "monospace" }}>${s.totalEarned.toFixed(4)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      {s.endpointUrl ? (
                        <a href={s.endpointUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                          {s.endpointUrl.slice(0, 32)}... <ExternalLink size={10} />
                        </a>
                      ) : <span style={{ color: "#374151", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {s.status === "LIVE" ? (
                          <button onClick={() => handleStop(s.id)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #2A2A35", background: "transparent", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <Square size={11} /> Stop
                          </button>
                        ) : s.status !== "DEPLOYING" ? (
                          <button onClick={() => handleStart(s.id)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #2A2A35", background: "transparent", color: "#10B981", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <Play size={11} /> Start
                          </button>
                        ) : null}
                        <button onClick={() => handleDelete(s.id)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #2A2A35", background: "transparent", color: "#6B7280", cursor: "pointer" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Activity({ size, style }: { size: number; style?: React.CSSProperties }) {
  return <BarChart3 size={size} style={style} />;
}
