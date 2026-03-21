"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface FuelPrice {
  id: string;
  fuelType: string;
  price: number;
  effectiveDate: string;
}

const COLORS: Record<string, string> = {
  DIESEL: "#ef4444",
  DIESEL_B7: "#f97316",
  GASOHOL_91: "#eab308",
  GASOHOL_95: "#22c55e",
  GASOHOL_E20: "#3b82f6",
  GASOHOL_E85: "#8b5cf6",
  LPG: "#ec4899",
  NGV: "#06b6d4",
};

export function PriceChart({ prices }: { prices: FuelPrice[] }) {
  // Group prices by date
  const dateMap = new Map<string, Record<string, number>>();
  prices.forEach((p) => {
    const date = new Date(p.effectiveDate).toLocaleDateString();
    if (!dateMap.has(date)) dateMap.set(date, {});
    dateMap.get(date)![p.fuelType] = p.price;
  });

  const chartData = Array.from(dateMap.entries())
    .map(([date, fuels]) => ({ date, ...fuels }))
    .reverse();

  const fuelTypes = [...new Set(prices.map((p) => p.fuelType))];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No price data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        {fuelTypes.map((type) => (
          <Line
            key={type}
            type="monotone"
            dataKey={type}
            stroke={COLORS[type] || "#666"}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
