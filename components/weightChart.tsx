"use client";

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface WeightChartProps {
  measurements: any[];
}

export default function WeightChart({ measurements }: WeightChartProps) {
  // Timestamps in JS-Date-Objekte umwandeln
  const chartData = useMemo(() => {
    return measurements.map((m) => ({
      ...m,
      createdAt: m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt),
    }));
  }, [measurements]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Gewichtsverlauf</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="createdAt"
            tickFormatter={(ts) => ts instanceof Date ? ts.toLocaleDateString() : ""}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(ts) => ts instanceof Date ? ts.toLocaleString() : ""}
          />
          <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
