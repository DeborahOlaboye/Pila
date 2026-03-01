"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  slug: string;
  endpointUrl: string;
  inputSchema: Record<string, string>;
}

export function SDKSnippet({ slug, endpointUrl, inputSchema }: Props) {
  const [tab, setTab] = useState<"ts" | "curl">("ts");
  const [copied, setCopied] = useState(false);

  const sampleInput = Object.fromEntries(
    Object.entries(inputSchema).map(([k, v]) => [k, v === "number" ? 0 : v === "boolean" ? false : "example"])
  );

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const proxyPath = `/api/proxy/${slug}`;

  const tsSnippet = `import { PinionClient } from "pinion-os";

const client = new PinionClient({
  privateKey: process.env.PINION_PRIVATE_KEY,
  apiUrl: "${baseUrl}",
  network: "base-sepolia",
});

const result = await client.request(
  "POST",
  "${proxyPath}",
  ${JSON.stringify(sampleInput, null, 2)}
);
console.log(result.data);`;

  const curlSnippet = `curl -X POST "${baseUrl}${proxyPath}" \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <your-signed-payment>" \\
  -d '${JSON.stringify(sampleInput)}'`;

  const content = tab === "ts" ? tsSnippet : curlSnippet;

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #2A2A35" }}>
      {/* Tabs */}
      <div style={{ display: "flex", background: "#111827", borderBottom: "1px solid #2A2A35" }}>
        {(["ts", "curl"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: tab === t ? "#1A1A1F" : "transparent",
              color: tab === t ? "#8B5CF6" : "#6B7280",
              borderBottom: tab === t ? "2px solid #7C3AED" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {t === "ts" ? "TypeScript" : "cURL"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={{
            padding: "10px 16px", border: "none", cursor: "pointer",
            background: "transparent", color: "#6B7280",
            display: "flex", alignItems: "center", gap: 6, fontSize: 12,
          }}
        >
          {copied ? <Check size={13} style={{ color: "#10B981" }} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {/* Code */}
      <pre style={{
        margin: 0, padding: 20, background: "#0F172A",
        fontSize: 13, lineHeight: 1.7, overflow: "auto",
        color: "#E2E8F0", fontFamily: "JetBrains Mono, monospace",
      }}>
        <code>{content}</code>
      </pre>
    </div>
  );
}
