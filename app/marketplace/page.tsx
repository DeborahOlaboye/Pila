"use client";

import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import { CATEGORY_LABELS } from "@/lib/constants";
import { PublicSkill } from "@/types";

const CATEGORIES = ["ALL", ...Object.keys(CATEGORY_LABELS)];

export default function MarketplacePage() {
  const [skills, setSkills] = useState<PublicSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("calls");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (search) params.set("q", search);
      try {
        const res = await fetch(`/api/skills?${params}`);
        const data = await res.json();
        setSkills(data);
      } catch { setSkills([]); }
      setLoading(false);
    }
    const timeout = setTimeout(load, 200);
    return () => clearTimeout(timeout);
  }, [search, category]);

  const sorted = [...skills].sort((a, b) => {
    if (sort === "calls") return b.totalCalls - a.totalCalls;
    if (sort === "earned") return b.totalEarned - a.totalEarned;
    if (sort === "price-low") return a.priceUsd - b.priceUsd;
    if (sort === "price-high") return b.priceUsd - a.priceUsd;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#F9FAFB", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Skill Marketplace
        </h1>
        <p style={{ fontSize: 16, color: "#6B7280", margin: 0 }}>
          Discover, test, and integrate x402 AI skills into your agents
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6B7280" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            style={{
              width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12,
              background: "#1A1A1F", border: "1px solid #2A2A35",
              color: "#F9FAFB", fontSize: 14, outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={14} style={{ color: "#6B7280" }} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: 12, background: "#1A1A1F", border: "1px solid #2A2A35", color: "#F9FAFB", fontSize: 14, outline: "none" }}
          >
            <option value="calls">Most Called</option>
            <option value="earned">Most Earned</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low</option>
            <option value="price-high">Price: High</option>
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "7px 16px", borderRadius: 100, border: "1px solid",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s",
              borderColor: category === cat ? "#7C3AED" : "#2A2A35",
              background: category === cat ? "rgba(124,58,237,0.15)" : "transparent",
              color: category === cat ? "#8B5CF6" : "#6B7280",
            }}
          >
            {cat === "ALL" ? "All" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: 16, background: "#1A1A1F", border: "1px solid #2A2A35", animation: "pulse 1.5s ease-in-out infinite alternate" }} />
          ))}
          <style>{`@keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }`}</style>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#4B5563" }}>
          <Filter size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#6B7280" }}>No skills found</h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            {search ? `No results for "${search}"` : "Be the first to deploy a skill!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {sorted.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
