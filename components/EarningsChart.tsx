"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  earned: number;
  calls: number;
}

interface Props {
  data: DataPoint[];
}

export function EarningsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563", fontSize: 14 }}>
        No earnings data yet
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="earnGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={{ background: "#1A1A1F", border: "1px solid #2A2A35", borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: "#9CA3AF" }}
          formatter={(value) => [`$${Number(value).toFixed(4)}`, "Earned"]}
        />
        <Area type="monotone" dataKey="earned" stroke="#7C3AED" strokeWidth={2} fill="url(#earnGradient)" dot={false} activeDot={{ r: 4, fill: "#8B5CF6" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
