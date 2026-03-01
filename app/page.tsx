import Link from "next/link";
import { Zap, Code2, Rocket, TrendingUp, ChevronRight, Shield, Globe, Cpu } from "lucide-react";

async function getStats() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/stats`, { next: { revalidate: 30 } });
    if (!res.ok) return { skills: 0, earned: 0, calls: 0 };
    return res.json();
  } catch {
    return { skills: 0, earned: 0, calls: 0 };
  }
}

async function getFeaturedSkills() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/skills`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const skills = await res.json();
    return skills.slice(0, 4);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedSkills()]);

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden" }}>
      {/* Background gradient blobs */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-30%", left: "20%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Hero Section */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 13, color: "#8B5CF6", fontWeight: 500 }}>Pila</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px", color: "#F9FAFB" }}>
            Build & sell AI skills{" "}
            <span style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #10B981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              in 2 minutes
            </span>
          </h1>

          <p style={{ fontSize: 20, color: "#9CA3AF", lineHeight: 1.6, margin: "0 0 40px", fontWeight: 400 }}>
            No code. No servers. Describe your skill in plain English — PILA generates the handler, deploys a live x402 endpoint, and starts earning USDC automatically.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/builder" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
              color: "white", fontSize: 16, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 0 32px rgba(124,58,237,0.5)",
              transition: "all 0.2s",
            }}>
              Start Building <ChevronRight size={18} />
            </Link>
            <Link href="/marketplace" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 12,
              border: "1px solid #2A2A35", background: "rgba(26,26,31,0.8)",
              color: "#D1D5DB", fontSize: 16, fontWeight: 600, textDecoration: "none",
              transition: "all 0.2s",
            }}>
              <Globe size={18} /> Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Stats ticker */}
        <div style={{ margin: "64px auto 0", maxWidth: 700, padding: "20px 32px", borderRadius: 16, background: "rgba(26,26,31,0.8)", border: "1px solid #2A2A35", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24 }}>
          {[
            { value: stats.skills, label: "Skills Deployed", suffix: "" },
            { value: stats.earned, label: "USDC Earned", prefix: "$" },
            { value: stats.calls, label: "Calls Served", suffix: "" },
          ].map(({ value, label, prefix, suffix }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#F9FAFB", fontFamily: "JetBrains Mono, monospace" }}>
                {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#F9FAFB", margin: "0 0 12px", letterSpacing: "-0.02em" }}>How it works</h2>
          <p style={{ fontSize: 16, color: "#6B7280", margin: 0 }}>Three steps from idea to earning x402 endpoint</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { step: "01", icon: Code2, title: "Describe", color: "#7C3AED", desc: "Tell PILA what your skill does in plain English. Set a USDC price and define input/output schemas." },
            { step: "02", icon: Cpu, title: "Generate", color: "#06B6D4", desc: "Claude writes clean TypeScript handler code in real-time. Review and edit before deploying." },
            { step: "03", icon: TrendingUp, title: "Deploy & Earn", color: "#10B981", desc: "One click deploys a live x402-paywalled endpoint. USDC flows directly to your dedicated Base wallet." },
          ].map(({ step, icon: Icon, title, color, desc }) => (
            <div key={step} style={{
              position: "relative", padding: 28, borderRadius: 20,
              background: "#1A1A1F", border: "1px solid #2A2A35",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div style={{ fontSize: 48, fontWeight: 800, color: "#2A2A35", fontFamily: "JetBrains Mono, monospace", marginBottom: 16, lineHeight: 1 }}>{step}</div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, color: "#F9FAFB" }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why PILA */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ padding: 48, borderRadius: 24, background: "rgba(26,26,31,0.8)", border: "1px solid #2A2A35", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", marginBottom: 20 }}>
              <Shield size={12} style={{ color: "#8B5CF6" }} />
              <span style={{ fontSize: 12, color: "#8B5CF6", fontWeight: 600 }}>BUILT ON PINION OS</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#F9FAFB", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              The Vercel of agent skill monetization
            </h2>
            <p style={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7, margin: "0 0 28px" }}>
              Every skill deployed through PILA is a new revenue node in the PinionOS ecosystem. Callable by any AI agent on Base — right now, with zero setup.
            </p>
            <Link href="/builder" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8B5CF6", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Deploy your first skill <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { before: "30-60 min setup", after: "2-minute deploy", icon: "⚡" },
              { before: "TypeScript required", after: "Plain English", icon: "✍️" },
              { before: "Manual hosting", after: "Managed endpoints", icon: "☁️" },
              { before: "No discoverability", after: "Public marketplace", icon: "🔍" },
            ].map(({ before, after, icon }) => (
              <div key={before} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 10, background: "#111827", border: "1px solid #1F2937" }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "#4B5563", textDecoration: "line-through", flex: 1 }}>{before}</span>
                <span style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>{after}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      {featured.length > 0 && (
        <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#F9FAFB", margin: 0, letterSpacing: "-0.02em" }}>Featured Skills</h2>
            <Link href="/marketplace" style={{ fontSize: 14, color: "#8B5CF6", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {featured.map((skill: any) => (
              <Link key={skill.id} href={`/marketplace/${skill.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: 20, borderRadius: 16, background: "#1A1A1F", border: "1px solid #2A2A35",
                  transition: "all 0.2s", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#F9FAFB" }}>{skill.name}</h3>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "#8B5CF6", background: "rgba(124,58,237,0.1)", padding: "2px 8px", borderRadius: 6 }}>${skill.priceUsd.toFixed(2)}</span>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{skill.description.slice(0, 80)}...</p>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#4B5563", fontFamily: "monospace" }}>
                    <span>{skill.totalCalls} calls</span>
                    <span style={{ color: "#10B981" }}>${skill.totalEarned.toFixed(2)} earned</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
