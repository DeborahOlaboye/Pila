import { BuilderForm } from "@/components/BuilderForm";
import { Rocket } from "lucide-react";

export default function BuilderPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Rocket size={20} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#F9FAFB", letterSpacing: "-0.02em" }}>
            Build a Skill
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 16, color: "#6B7280" }}>
          Describe your skill in plain English. Claude generates the code. You earn USDC automatically.
        </p>
      </div>

      <BuilderForm />
    </div>
  );
}
