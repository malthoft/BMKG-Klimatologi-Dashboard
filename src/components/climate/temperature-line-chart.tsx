"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ClimateParsedResult } from "@/lib/climate-parser";

interface TemperatureLineChartProps {
  parsedData: ClimateParsedResult | null;
  selectedRegion: string;
}

export function TemperatureLineChart({ parsedData, selectedRegion }: TemperatureLineChartProps) {
  const chartData = useMemo(() => {
    if (!parsedData || !selectedRegion) return [];
    
    return parsedData.years.map((year, index) => {
      const regionInfo = parsedData.regionsData[selectedRegion];
      const anomaly = regionInfo?.anomalies[index];
      const val = anomaly !== undefined ? anomaly + regionInfo.baseline : undefined;
      return {
        year,
        temperature: val !== undefined ? parseFloat(val.toFixed(2)) : null,
      };
    }).filter(item => item.temperature !== null);
  }, [parsedData, selectedRegion]);

  if (!parsedData) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center border border-border rounded-xl bg-surface-container-low text-secondary text-sm">
        <span className="material-symbols-outlined text-4xl mb-2 animate-pulse">monitoring</span>
        <p>Memuat data grafik suhu...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center border border-border rounded-xl bg-surface-container-low text-secondary text-sm">
        <span className="material-symbols-outlined text-4xl mb-2">info</span>
        <p>Data suhu tidak tersedia untuk wilayah ini.</p>
      </div>
    );
  }

  // Calculate average for reference line
  const averageTemp = chartData.reduce((sum, item) => sum + (item.temperature || 0), 0) / chartData.length;

  return (
    <div className="w-full bg-surface border border-border rounded-xl p-4 md:p-6 shadow-sm">
      <div className="mb-6 text-center md:text-left">
        <h3 className="text-xl font-bold text-text-primary">Grafik Perubahan Suhu Rata-rata Tahunan</h3>
        <p className="text-sm text-text-secondary mt-1">Wilayah: {selectedRegion}</p>
      </div>
      
      <div className="w-full h-[350px] md:h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.2)" vertical={false} />
            <XAxis 
              dataKey="year" 
              tick={{ fill: "#64748b", fontSize: 12 }} 
              tickMargin={10}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => `${value}°C`}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
              width={60}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface border border-border shadow-lg rounded-lg p-3 text-sm">
                      <p className="font-bold text-text-primary mb-1">Tahun {label}</p>
                      <p className="text-primary font-semibold">
                        Suhu: {payload[0].value}°C
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine 
              y={averageTemp} 
              stroke="#94a3b8" 
              strokeDasharray="5 5"
              label={{ position: 'insideTopLeft', value: `Rata-rata: ${averageTemp.toFixed(2)}°C`, fill: '#64748b', fontSize: 12 }} 
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
