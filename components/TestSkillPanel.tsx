"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  slug: string;
  priceUsd: number;
  inputSchema: Record<string, string>;
}

const TYPE_LABEL: Record<string, string> = {
  string: "Text",
  number: "Number",
  boolean: "Yes / No",
};

function initFields(schema: Record<string, string>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(schema).map(([k, t]) =>
      [k, t === "number" ? 0 : t === "boolean" ? false : ""]
    )
  );
}

export function TestSkillPanel({ slug, priceUsd, inputSchema }: Props) {
  const hasInputs = Object.keys(inputSchema).length > 0;
  const [fields, setFields] = useState<Record<string, string | number | boolean>>(
    () => initFields(inputSchema)
  );
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: string, val: string | number | boolean) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  async function handleTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, input: fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Call failed");
      // Normalise: if data.result is an object use it, else wrap it
      const raw = data.result;
      setResult(raw && typeof raw === "object" ? raw : { result: raw });
      setLatency(data.latencyMs);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Inputs */}
      {hasInputs ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.entries(inputSchema).map(([key, type]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 8 }}>
                {key}
                <span style={{ fontSize: 11, color: "#4B5563", fontWeight: 400 }}>
                  ({TYPE_LABEL[type] ?? type})
                </span>
              </label>
              {type === "boolean" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setField(key, !fields[key])}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: fields[key] ? "#7C3AED" : "#374151",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, left: fields[key] ? 22 : 3,
                      width: 18, height: 18, borderRadius: "50%", background: "white",
                      transition: "left 0.2s",
                    }} />
                  </button>
                  <span style={{ fontSize: 13, color: "#D1D5DB" }}>{fields[key] ? "Yes" : "No"}</span>
                </div>
              ) : type === "number" ? (
                <input
                  type="number"
                  value={fields[key] as number}
                  onChange={(e) => setField(key, parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              ) : (
                <input
                  type="text"
                  value={fields[key] as string}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={`Enter ${key}…`}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 14, borderRadius: 8, background: "#111827", border: "1px solid #1F2937", color: "#6B7280", fontSize: 13 }}>
          This skill needs no inputs — just click Test below.
        </div>
      )}

      {/* Call button */}
      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "12px 24px", borderRadius: 10, border: "none",
          background: loading ? "#374151" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
          color: "white", fontSize: 14, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 0 16px rgba(124,58,237,0.4)",
          transition: "all 0.2s",
        }}
      >
        {loading
          ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          : <Play size={16} />}
        {loading ? "Calling…" : `Test Call ($${priceUsd.toFixed(2)} USDC)`}
      </button>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", gap: 10, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: 13, alignItems: "flex-start" }}>
          <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: "#10B981" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#10B981" }}>Success</span>
            </div>
            {latency && (
              <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{latency}ms</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(result).map(([key, val]) => (
              <div key={key} style={{ display: "flex", gap: 12, padding: "12px 16px", background: "#0F172A", borderRadius: 8, border: "1px solid #1E293B", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", minWidth: 90, paddingTop: 1, textTransform: "capitalize" }}>{key}</span>
                <span style={{ fontSize: 14, color: "#86EFAC", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
                  {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val ?? "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  background: "#111827", border: "1px solid #2A2A35",
  color: "#F9FAFB", fontSize: 14, outline: "none",
};
