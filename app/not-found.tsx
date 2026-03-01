import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 600, margin: "120px auto", padding: "0 24px", textAlign: "center" }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: "#2A2A35", fontFamily: "JetBrains Mono, monospace", marginBottom: 16 }}>404</div>
      <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 600, color: "#F9FAFB" }}>Page not found</h2>
      <p style={{ margin: "0 0 32px", color: "#6B7280", fontSize: 15 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
        Back to Home
      </Link>
    </div>
  );
}
