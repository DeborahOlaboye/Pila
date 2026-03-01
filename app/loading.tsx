export default function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        <span style={{ color: "#6B7280", fontSize: 14 }}>Loading...</span>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }`}</style>
    </div>
  );
}
