"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Play, Loader2, CheckCircle2, XCircle, Wallet } from "lucide-react";

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

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isNumeric(val: unknown): boolean {
  return !isNaN(parseFloat(String(val))) && String(val).trim() !== "";
}

function randomBytes32(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ("0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

function initFields(schema: Record<string, string>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(schema).map(([k, t]) =>
      [k, t === "number" ? 0 : t === "boolean" ? false : ""]
    )
  );
}

interface PaymentRequirements {
  payTo: string;
  maxAmountRequired: string;
  asset: string;
  network: string;
  scheme: string;
  maxTimeoutSeconds?: number;
  extra?: { name?: string; version?: string };
}

interface Pending402 {
  x402Version: number;
  requirements: PaymentRequirements;
}

function getChainId(network: string): number {
  if (network === "base" || network === "eip155:8453") return 8453;
  if (network === "base-sepolia" || network === "eip155:84532") return 84532;
  const m = network.match(/^eip155:(\d+)$/);
  return m ? parseInt(m[1]) : 8453;
}

export function TestSkillPanel({ slug, priceUsd, inputSchema }: Props) {
  const hasInputs = Object.keys(inputSchema).length > 0;
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [fields, setFields] = useState<Record<string, string | number | boolean>>(
    () => initFields(inputSchema)
  );
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending402, setPending402] = useState<Pending402 | null>(null);

  function setField(key: string, val: string | number | boolean) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  async function callProxy(xPayment?: string): Promise<void> {
    const start = Date.now();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (xPayment) headers["X-PAYMENT"] = xPayment;

    const res = await fetch(`/api/proxy/${slug}`, {
      method: "POST",
      headers,
      body: JSON.stringify(fields),
    });

    // ── x402: payment required ───────────────────────────────────────────
    if (res.status === 402) {
      const body = await res.json();
      if (body.accepts?.length > 0) {
        setPending402({ x402Version: body.x402Version ?? 1, requirements: body.accepts[0] });
      } else {
        setError("Payment required but could not parse requirements.");
      }
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Call failed");

    const latencyMs = Date.now() - start;
    const raw = data;
    setResult(raw && typeof raw === "object" ? raw : { result: raw });
    setLatency(latencyMs);
    setPending402(null);
  }

  async function handleTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    setPending402(null);
    try {
      await callProxy();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!pending402 || !address) return;
    setLoading(true);
    setError(null);
    try {
      const { x402Version, requirements } = pending402;
      const nonce = randomBytes32();
      const nowSec = Math.floor(Date.now() / 1000);
      const validAfter = BigInt(nowSec - 600);
      const validBefore = BigInt(nowSec + (requirements.maxTimeoutSeconds ?? 900));

      const signature = await signTypedDataAsync({
        domain: {
          name: requirements.extra?.name ?? "USD Coin",
          version: requirements.extra?.version ?? "2",
          chainId: getChainId(requirements.network),
          verifyingContract: requirements.asset as `0x${string}`,
        },
        types: {
          TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
          ],
        },
        primaryType: "TransferWithAuthorization",
        message: {
          from: address,
          to: requirements.payTo as `0x${string}`,
          value: BigInt(requirements.maxAmountRequired),
          validAfter,
          validBefore,
          nonce,
        },
      });

      const payload = {
        x402Version,
        scheme: requirements.scheme,
        network: requirements.network,
        payload: {
          signature,
          authorization: {
            from: address,
            to: requirements.payTo,
            value: requirements.maxAmountRequired,
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce,
          },
        },
      };

      const xPayment = btoa(JSON.stringify(payload));
      await callProxy(xPayment);
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
              <label style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF" }}>
                {humanize(key)}
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
      {!pending402 && (
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
      )}

      {/* x402 payment prompt */}
      {pending402 && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(245,158,11,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={15} style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B" }}>Payment Required (x402)</span>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Amount", value: `${(parseInt(pending402.requirements.maxAmountRequired) / 1e6).toFixed(6)} USDC` },
              { label: "Pay to", value: `${pending402.requirements.payTo.slice(0, 8)}…${pending402.requirements.payTo.slice(-6)}` },
              { label: "Network", value: pending402.requirements.network },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#6B7280" }}>{label}</span>
                <span style={{ color: "#D1D5DB", fontFamily: "monospace" }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
            <button
              onClick={handlePay}
              disabled={loading || !address}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 0", borderRadius: 10, border: "none",
                background: !address ? "#374151" : loading ? "#374151" : "linear-gradient(135deg, #D97706, #F59E0B)",
                color: "white", fontSize: 14, fontWeight: 600,
                cursor: loading || !address ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                : <Wallet size={15} />}
              {!address ? "Connect wallet to pay" : loading ? "Signing…" : "Sign & Pay with USDC"}
            </button>
            <button
              onClick={() => { setPending402(null); setError(null); }}
              style={{ padding: "11px 16px", borderRadius: 10, border: "1px solid #2A2A35", background: "transparent", color: "#6B7280", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: "flex", gap: 10, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: 13, alignItems: "flex-start" }}>
          <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(16,185,129,0.25)", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "rgba(16,185,129,0.08)", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={15} style={{ color: "#10B981" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>Skill responded successfully</span>
            </div>
            {latency && <span style={{ fontSize: 12, color: "#6B7280" }}>{latency}ms</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#111827" }}>
            {Object.entries(result).map(([key, val]) => {
              const display = typeof val === "boolean" ? (val ? "Yes" : "No") : String(val ?? "—");
              const numeric = isNumeric(val);
              return (
                <div key={key} style={{ padding: "16px 20px", borderBottom: "1px solid #1F2937" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {humanize(key)}
                  </div>
                  <div style={{
                    fontSize: numeric ? 32 : 18, fontWeight: 700,
                    color: numeric ? "#8B5CF6" : "#F9FAFB",
                    fontFamily: numeric ? "JetBrains Mono, monospace" : "Inter, sans-serif",
                    lineHeight: 1.2, wordBreak: "break-word",
                  }}>
                    {display}
                  </div>
                </div>
              );
            })}
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
