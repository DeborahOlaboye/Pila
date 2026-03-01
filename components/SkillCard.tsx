"use client";

import Link from "next/link";
import { PublicSkill } from "@/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/constants";
import { TrendingUp, Zap } from "lucide-react";

interface Props {
  skill: PublicSkill;
  showActions?: boolean;
}

export function SkillCard({ skill, showActions = true }: Props) {
  const statusColor = skill.status === "LIVE" ? "#10B981" : skill.status === "STOPPED" ? "#EF4444" : "#F59E0B";

  return (
    <div
      className="glow-hover"
      style={{
        background: "#1A1A1F",
        border: "1px solid #2A2A35",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[skill.category] || "✨"}</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#F9FAFB", lineHeight: 1.2 }}>
              {skill.name}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {skill.description}
          </p>
        </div>
        <div style={{
          flexShrink: 0,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
          fontSize: 13, fontWeight: 600, color: "#8B5CF6",
          fontFamily: "monospace", whiteSpace: "nowrap",
        }}>
          ${skill.priceUsd.toFixed(2)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, padding: "12px 0", borderTop: "1px solid #2A2A35", borderBottom: "1px solid #2A2A35" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Zap size={13} style={{ color: "#8B5CF6" }} />
          <span style={{ fontSize: 13, fontFamily: "monospace", color: "#D1D5DB" }}>
            {skill.totalCalls.toLocaleString()} calls
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <TrendingUp size={13} style={{ color: "#10B981" }} />
          <span style={{ fontSize: 13, fontFamily: "monospace", color: "#10B981" }}>
            ${skill.totalEarned.toFixed(2)} earned
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} className={skill.status === "LIVE" ? "animate-live" : ""} />
          <span style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {CATEGORY_LABELS[skill.category]}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/marketplace/${skill.id}`}
            style={{
              flex: 1, textAlign: "center", padding: "8px 0",
              borderRadius: 8, background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#8B5CF6", fontSize: 13, fontWeight: 600,
              textDecoration: "none", transition: "all 0.15s",
            }}
          >
            Test →
          </Link>
          <button
            onClick={() => {
              const snippet = `import { PinionClient } from "pinion-os";\nconst p = new PinionClient({ privateKey: process.env.PINION_PRIVATE_KEY });\nconst r = await p.callSkill("${skill.endpointUrl}", {});`;
              navigator.clipboard.writeText(snippet);
            }}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid #2A2A35", background: "transparent",
              color: "#9CA3AF", fontSize: 13, cursor: "pointer",
            }}
          >
            SDK ↗
          </button>
        </div>
      )}
    </div>
  );
}
