interface Props {
  calls: number;
  earned: number;
  avgLatency?: number;
}

export function MetricsBadge({ calls, earned, avgLatency }: Props) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#F9FAFB", fontFamily: "JetBrains Mono, monospace" }}>
          {calls.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Total Calls</div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#10B981", fontFamily: "JetBrains Mono, monospace" }}>
          ${earned.toFixed(2)}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>USDC Earned</div>
      </div>
      {avgLatency !== undefined && (
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>
            {avgLatency}ms
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Avg Latency</div>
        </div>
      )}
    </div>
  );
}
