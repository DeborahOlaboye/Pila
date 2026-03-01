"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Wand2, Rocket, CheckCircle, Copy, Download, X, Plus, Trash2 } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { DeploymentStatus } from "./DeploymentStatus";
import { SDKSnippet } from "./SDKSnippet";

interface SchemaField { name: string; type: string }

interface DeployedSkill {
  id: string;
  slug: string;
  endpointUrl: string;
  walletAddress: string;
  priceUsd: number;
  inputSchema: Record<string, string>;
}

const TYPE_OPTIONS = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
];

function FieldBuilder({ fields, onChange, placeholder }: {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  placeholder: string;
}) {
  function add() { onChange([...fields, { name: "", type: "string" }]); }
  function remove(i: number) { onChange(fields.filter((_, idx) => idx !== i)); }
  function update(i: number, key: "name" | "type", val: string) {
    const next = [...fields];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {fields.map((f, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={f.name}
            onChange={(e) => update(i, "name", e.target.value)}
            placeholder={placeholder}
            style={{ ...inputStyle, flex: 1 }}
          />
          <select
            value={f.type}
            onChange={(e) => update(i, "type", e.target.value)}
            style={{ ...inputStyle, width: 110 }}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => remove(i)}
            style={{ padding: "8px", borderRadius: 6, border: "1px solid #2A2A35", background: "transparent", color: "#6B7280", cursor: "pointer", display: "flex" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px dashed #3A3A45", background: "transparent", color: "#8B5CF6", fontSize: 13, cursor: "pointer", width: "fit-content" }}
      >
        <Plus size={13} /> Add field
      </button>
    </div>
  );
}

export function BuilderForm() {
  const { data: session } = useSession();

  const [form, setForm] = useState({
    name: "",
    category: "CUSTOM" as keyof typeof CATEGORY_LABELS,
    description: "",
    priceUsd: "0.02",
    tags: "",
  });
  const [inputFields, setInputFields] = useState<SchemaField[]>([]);
  const [outputFields, setOutputFields] = useState<SchemaField[]>([{ name: "result", type: "string" }]);

  const [generatedCode, setGeneratedCode] = useState("");
  const [editedCode, setEditedCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [deployedSkill, setDeployedSkill] = useState<DeployedSkill | null>(null);
  const [error, setError] = useState("");

  const code = editedCode || generatedCode;

  function buildSchemas() {
    const inputSchema = Object.fromEntries(inputFields.filter(f => f.name.trim()).map(f => [f.name.trim(), f.type]));
    const outputSchema = Object.fromEntries(outputFields.filter(f => f.name.trim()).map(f => [f.name.trim(), f.type]));
    return { inputSchema, outputSchema };
  }

  async function handleGenerate() {
    setError("");
    if (!form.name || !form.description) { setError("Skill name and description are required."); return; }
    setGenerating(true);
    try {
      const { inputSchema, outputSchema } = buildSchemas();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, inputSchema, outputSchema, priceUsd: parseFloat(form.priceUsd) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedCode(data.code);
      setEditedCode("");
    } catch (e) { setError(String(e)); }
    setGenerating(false);
  }

  async function handleDeploy() {
    if (!code) { setError("Generate handler code first."); return; }
    setError("");
    setDeploying(true);
    setDeployDone(false);
    try {
      const { inputSchema, outputSchema } = buildSchemas();

      const createRes = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description,
          category: form.category, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          priceUsd: parseFloat(form.priceUsd), inputSchema, outputSchema, handlerCode: code,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || "Create failed");

      const deployRes = await fetch(`/api/skills/${created.id}/deploy`, { method: "POST" });
      const deployed = await deployRes.json();
      if (!deployRes.ok) throw new Error(deployed.error || "Deploy failed");

      setDeployedSkill({ id: created.id, slug: created.slug, endpointUrl: deployed.endpointUrl, walletAddress: deployed.walletAddress, priceUsd: parseFloat(form.priceUsd), inputSchema });
    } catch (e) { setError(String(e)); setDeploying(false); }
  }

  if (deployedSkill) {
    return (
      <div className="animate-fade-in" style={{ background: "#1A1A1F", borderRadius: 20, padding: 32, border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 0 40px rgba(16,185,129,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <CheckCircle size={28} style={{ color: "#10B981" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#F9FAFB" }}>Your Skill is LIVE!</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>Earning USDC on Base</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Endpoint", value: deployedSkill.endpointUrl, mono: true },
            { label: "Wallet", value: deployedSkill.walletAddress, mono: true },
            { label: "Price", value: `$${deployedSkill.priceUsd.toFixed(2)} per call`, mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#111827", borderRadius: 8, border: "1px solid #1F2937" }}>
              <span style={{ fontSize: 13, color: "#6B7280", minWidth: 70 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#E2E8F0", fontFamily: mono ? "JetBrains Mono, monospace" : "inherit", wordBreak: "break-all" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>SDK Snippet</div>
          <SDKSnippet slug={deployedSkill.slug} endpointUrl={deployedSkill.endpointUrl} inputSchema={deployedSkill.inputSchema} />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/marketplace" style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Rocket size={15} /> View in Marketplace
          </a>
          <a href={`/api/plugin/${deployedSkill.id}`} download="openclaw.plugin.json" style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #2A2A35", background: "transparent", color: "#9CA3AF", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={15} /> Plugin JSON
          </a>
          <button onClick={() => { setDeployedSkill(null); setGeneratedCode(""); setEditedCode(""); setForm({ name: "", category: "CUSTOM", description: "", priceUsd: "0.02", tags: "" }); setInputFields([]); setOutputFields([{ name: "result", type: "string" }]); }} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #2A2A35", background: "transparent", color: "#6B7280", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <X size={15} /> Build Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* LEFT: Form */}
      <div style={{ background: "#1A1A1F", borderRadius: 20, padding: 28, border: "1px solid #2A2A35", display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#F9FAFB" }}>Build a New Skill</h2>

        {error && (
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <Field label="Skill Name *">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Crypto Fear & Greed Index" style={inputStyle} />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as keyof typeof CATEGORY_LABELS }))} style={inputStyle}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>

        <Field label="What does this skill do? *">
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Returns the current crypto market fear & greed index (0-100) with a market interpretation." style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        <Field label="Input Fields" hint="What information does this skill need from the caller? Add one field per row.">
          <FieldBuilder fields={inputFields} onChange={setInputFields} placeholder="e.g. city, symbol, amount" />
        </Field>

        <Field label="Output Fields" hint="What does this skill return? Add one field per row.">
          <FieldBuilder fields={outputFields} onChange={setOutputFields} placeholder="e.g. price, score, message" />
        </Field>

        <Field label="Price per call (USDC)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#6B7280", fontSize: 16 }}>$</span>
            <input type="number" min="0.001" step="0.001" value={form.priceUsd} onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
            <span style={{ color: "#6B7280", fontSize: 13 }}>USDC</span>
          </div>
        </Field>

        <button
          onClick={handleGenerate}
          disabled={generating || !session}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 0", borderRadius: 10,
            background: !session ? "#2D2D35" : generating ? "#374151" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
            color: !session ? "#6B7280" : "white", fontSize: 14, fontWeight: 600,
            cursor: generating || !session ? "not-allowed" : "pointer",
            boxShadow: session && !generating ? "0 0 16px rgba(124,58,237,0.3)" : "none",
            border: !session ? "1px dashed #3A3A45" : "none",
          }}
        >
          {generating ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 size={16} />}
          {generating ? "Generating..." : !session ? "🔒 Connect Wallet to Generate" : "✨ Generate Handler Code"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* RIGHT: Code preview + deploy */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#1A1A1F", borderRadius: 20, padding: 28, border: "1px solid #2A2A35", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>Handler Code</h3>
            {code && (
              <button onClick={() => navigator.clipboard.writeText(code)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid #2A2A35", background: "transparent", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>
                <Copy size={11} /> Copy
              </button>
            )}
          </div>
          {code ? (
            <textarea
              value={code}
              onChange={(e) => setEditedCode(e.target.value)}
              style={{
                flex: 1, minHeight: 320, width: "100%",
                background: "#0F172A", borderRadius: 10, border: "1px solid #1E293B",
                padding: 16, color: "#E2E8F0", fontSize: 13,
                fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7,
                resize: "none", outline: "none",
              }}
            />
          ) : (
            <div style={{ flex: 1, minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A", borderRadius: 10, border: "1px solid #1E293B" }}>
              <div style={{ textAlign: "center", color: "#4B5563" }}>
                <Wand2 size={32} style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Fill the form and click Generate</p>
              </div>
            </div>
          )}
        </div>

        {code && !deploying && !deployDone && (
          <button
            onClick={handleDeploy}
            disabled={!session}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 0", borderRadius: 12, border: "none",
              background: session ? "linear-gradient(135deg, #059669, #10B981)" : "#374151",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: session ? "pointer" : "not-allowed",
              boxShadow: session ? "0 0 24px rgba(16,185,129,0.3)" : "none",
            }}
          >
            <Rocket size={18} /> Deploy Skill
          </button>
        )}

        {deploying && (
          <DeploymentStatus isDeploying={deploying} onComplete={() => { setDeployDone(true); }} />
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF" }}>{label}</label>
      {hint && <p style={{ margin: 0, fontSize: 11, color: "#4B5563", lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  background: "#111827", border: "1px solid #2A2A35",
  color: "#F9FAFB", fontSize: 14, outline: "none",
  transition: "border-color 0.15s",
};
