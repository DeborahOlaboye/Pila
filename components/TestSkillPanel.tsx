"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface Props {
  slug: string;
  priceUsd: number;
  inputSchema: Record<string, string>;
}

export function TestSkillPanel({ slug, priceUsd, inputSchema }: Props) {
  const defaultInput = Object.keys(inputSchema).length === 0
    ? "{}"
    : JSON.stringify(
        Object.fromEntries(
          Object.entries(inputSchema).map(([k, v]) => [k, v === "number" ? 0 : "example"])
        ),
        null, 2
      );

  const [input, setInput] = useState(defaultInput);
  const [result, setResult] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(input); } catch { parsed = {}; }
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, input: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Call failed");
      setResult(JSON.stringify(data.result, null, 2));
      setLatency(data.latencyMs);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Input (JSON)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          style={{
            width: "100%", borderRadius: 8, padding: 12,
            background: "#111827", border: "1px solid #2A2A35",
            color: "#E2E8F0", fontSize: 13, fontFamily: "JetBrains Mono, monospace",
            resize: "vertical", outline: "none", lineHeight: 1.6,
          }}
        />
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "12px 24px", borderRadius: 10, border: "none",
          background: loading ? "#374151" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
          color: "white", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 0 16px rgba(124,58,237,0.4)",
          transition: "all 0.2s",
        }}
      >
        {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={16} />}
        {loading ? "Calling..." : `Test Call ($${priceUsd.toFixed(2)} USDC)`}
      </button>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5", fontSize: 13 }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Response</span>
            {latency && <span style={{ fontSize: 12, color: "#10B981", fontFamily: "monospace" }}>{latency}ms</span>}
          </div>
          <pre style={{
            margin: 0, padding: 16, borderRadius: 8,
            background: "#0F172A", border: "1px solid #1E293B",
            color: "#86EFAC", fontSize: 13, fontFamily: "JetBrains Mono, monospace",
            overflow: "auto", lineHeight: 1.6,
          }}>
            {result}
          </pre>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
