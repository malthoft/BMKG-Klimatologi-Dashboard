"use client";

import React, { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClimateParsedResult } from "@/lib/climate-parser";

interface TemperatureLineChartProps {
  parsedData: ClimateParsedResult | null;
  selectedRegion: string;
}

export function TemperatureLineChart({ parsedData, selectedRegion }: TemperatureLineChartProps) {
  const { chartData, yMin, yMax, yTicks, xTicks, stats } = useMemo(() => {
    if (!parsedData || !selectedRegion) {
      return {
        chartData: [],
        yMin: 22.0,
        yMax: 25.0,
        yTicks: [],
        xTicks: [],
        stats: null,
      };
    }
    
    const rawData = parsedData.years.map((year, index) => {
      const regionInfo = parsedData.regionsData[selectedRegion];
      const anomaly = regionInfo?.anomalies[index];
      const val = anomaly !== undefined ? anomaly + regionInfo.baseline : undefined;
      return {
        year,
        temperature: val !== undefined ? parseFloat(val.toFixed(2)) : null,
      };
    }).filter((item): item is { year: number; temperature: number } => item.temperature !== null);

    const n = rawData.length;
    if (n === 0) {
      return {
        chartData: [],
        yMin: 22.0,
        yMax: 25.0,
        yTicks: [],
        xTicks: [],
        stats: null,
      };
    }

    // Linear regression (y = mx + c) for the trend line
    const sumX = rawData.reduce((sum, d) => sum + d.year, 0);
    const sumY = rawData.reduce((sum, d) => sum + d.temperature, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let denominator = 0;
    for (const d of rawData) {
      numerator += (d.year - meanX) * (d.temperature - meanY);
      denominator += (d.year - meanX) * (d.year - meanX);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    const dataWithTrend = rawData.map((d) => {
      const trendVal = slope * d.year + intercept;
      return {
        ...d,
        trend: parseFloat(trendVal.toFixed(2)),
      };
    });

    // Statistical calculations for informative summary cards
    const temperatures = dataWithTrend.map((d) => d.temperature);
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / n;
    let minItem = dataWithTrend[0];
    let maxItem = dataWithTrend[0];
    for (const d of dataWithTrend) {
      if (d.temperature < minItem.temperature) minItem = d;
      if (d.temperature > maxItem.temperature) maxItem = d;
    }
    const decadeTrend = slope * 10; // °C per decade

    // Determine Y-axis bounds
    const allValues = dataWithTrend.flatMap((d) => [d.temperature, d.trend]);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);

    const calculatedYMin = Math.floor(minVal);
    const calculatedYMax = Math.ceil(maxVal);

    // Determine step size (0.5 degree intervals)
    const step = 0.5;

    const ticks: number[] = [];
    for (let v = calculatedYMin; v <= calculatedYMax + 0.001; v += step) {
      ticks.push(Number(v.toFixed(1)));
    }

    // Dynamic X-axis ticks adapting to ANY year range uploaded by admin
    const allYears = dataWithTrend.map((d) => d.year);
    const minYear = allYears[0];
    const maxYear = allYears[allYears.length - 1];
    const yearSpan = maxYear - minYear;

    // Determine adaptive step so ticks are readable for any dataset length
    const xStep = yearSpan <= 15 ? 1 : yearSpan <= 40 ? 2 : 5;
    const dynamicXTicks: number[] = [];
    for (let y = minYear; y <= maxYear; y += xStep) {
      dynamicXTicks.push(y);
    }
    // Always guarantee the latest year is displayed so admin sees the latest uploaded data point
    if (!dynamicXTicks.includes(maxYear)) {
      if (maxYear - dynamicXTicks[dynamicXTicks.length - 1] === 1 && dynamicXTicks.length > 2) {
        dynamicXTicks[dynamicXTicks.length - 1] = maxYear;
      } else {
        dynamicXTicks.push(maxYear);
      }
    }

    return {
      chartData: dataWithTrend,
      yMin: calculatedYMin,
      yMax: calculatedYMax,
      yTicks: ticks,
      xTicks: dynamicXTicks,
      period: {
        start: minYear,
        end: maxYear,
        count: n,
      },
      stats: {
        avg: avgTemp,
        min: minItem,
        max: maxItem,
        trendPerDecade: decadeTrend,
      },
    };
  }, [parsedData, selectedRegion]);

  if (!parsedData) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center border border-border rounded-2xl bg-surface-container-low text-secondary text-sm">
        <span className="material-symbols-outlined text-4xl mb-2 animate-pulse">monitoring</span>
        <p>Memuat data grafik trend suhu...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center border border-border rounded-2xl bg-surface-container-low text-secondary text-sm">
        <span className="material-symbols-outlined text-4xl mb-2">info</span>
        <p>Data suhu tidak tersedia untuk wilayah ini.</p>
      </div>
    );
  }

  const period = chartData.length > 0 ? {
    start: chartData[0].year,
    end: chartData[chartData.length - 1].year,
    count: chartData.length,
  } : null;

  return (
    <div className="w-full bg-white border border-border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-6 overflow-hidden">
      {/* Header & Title matching reference image with dynamic period */}
      <div className="flex flex-col items-center text-center space-y-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Trend Suhu Udara
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-500">
          <span>Wilayah: <strong className="text-primary font-bold">{selectedRegion}</strong></span>
          {period && (
            <>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                Periode: {period.start} – {period.end} ({period.count} Tahun Data)
              </span>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="w-3.5 h-1 bg-[#356a9a] rounded-sm inline-block"></span>
            <span className="text-slate-700">Suhu Udara</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-[#7a8288] inline-block"></span>
            <span className="text-slate-700">Trend</span>
          </div>
        </div>
      </div>

      {/* Climate Summary Stats Cards to eliminate empty space sensation */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-100/90 flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rata-rata</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">
              {stats.avg.toFixed(2).replace(".", ",")} °C
            </span>
          </div>

          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-100/90 flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tertinggi</span>
            <span className="text-base sm:text-lg font-extrabold text-rose-600 mt-0.5">
              {stats.max.temperature.toFixed(2).replace(".", ",")} °C
            </span>
            <span className="text-[10px] text-slate-400 font-medium">({stats.max.year})</span>
          </div>

          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-100/90 flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Terendah</span>
            <span className="text-base sm:text-lg font-extrabold text-blue-600 mt-0.5">
              {stats.min.temperature.toFixed(2).replace(".", ",")} °C
            </span>
            <span className="text-[10px] text-slate-400 font-medium">({stats.min.year})</span>
          </div>

          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-100/90 flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Laju Tren</span>
            <span className={`text-base sm:text-lg font-extrabold mt-0.5 ${stats.trendPerDecade >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {stats.trendPerDecade >= 0 ? "+" : ""}{stats.trendPerDecade.toFixed(3).replace(".", ",")}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">°C / dekade</span>
          </div>
        </div>
      )}
      
      {/* Chart Canvas */}
      <div className="w-full h-[400px] sm:h-[460px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 25, left: 10, bottom: 25 }}
          >
            <defs>
              {/* Soft atmospheric gradient under the line down to baseline 22°C */}
              <linearGradient id="temperatureAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#356a9a" stopOpacity={0.22} />
                <stop offset="65%" stopColor="#356a9a" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#356a9a" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines only, exactly matching reference image */}
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="#e2e8f0"
              vertical={false}
            />

            {/* X-Axis: Rotated -90 degrees, showing even years */}
            <XAxis 
              dataKey="year" 
              ticks={xTicks}
              interval={0}
              angle={-90}
              textAnchor="end"
              height={55}
              dy={8}
              tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={{ stroke: "#cbd5e1" }}
            />

            {/* Y-Axis: Shows down to calculatedYMin with 0.5 step */}
            <YAxis 
              domain={[yMin, yMax]}
              ticks={yTicks}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) => value.toFixed(1).replace(".", ",")}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={{ stroke: "#cbd5e1" }}
              width={75}
              label={{
                value: "Suhu (Celcius)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                style: {
                  textAnchor: "middle",
                  fill: "#334155",
                  fontSize: 13,
                  fontWeight: 600,
                },
              }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const tempItem = payload.find((p) => p.dataKey === "temperature");
                  const trendItem = payload.find((p) => p.dataKey === "trend");
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-3.5 text-sm">
                      <p className="font-bold text-slate-800 mb-2">Tahun {label}</p>
                      {tempItem && tempItem.value !== undefined && (
                        <p className="text-[#356a9a] font-bold flex items-center gap-2">
                          <span className="w-2.5 h-1.5 bg-[#356a9a] rounded-sm inline-block"></span>
                          Suhu Udara: {Number(tempItem.value).toFixed(2).replace(".", ",")} °C
                        </p>
                      )}
                      {trendItem && trendItem.value !== undefined && (
                        <p className="text-slate-600 font-semibold flex items-center gap-2 mt-1">
                          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#7a8288] inline-block"></span>
                          Trend: {Number(trendItem.value).toFixed(2).replace(".", ",")} °C
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Soft area fill to give visual weight down to 22.0°C and remove empty dead space */}
            <Area
              type="linear"
              dataKey="temperature"
              fill="url(#temperatureAreaGrad)"
              stroke="none"
              isAnimationActive={true}
              animationDuration={1200}
            />

            {/* Dashed Gray Trend Line (linear regression) matching reference image */}
            <Line
              type="linear"
              dataKey="trend"
              name="Trend"
              stroke="#7a8288"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={false}
              animationDuration={1200}
            />

            {/* Solid Steel-Blue Actual Temperature Line (angular linear segments, no dots) */}
            <Line
              type="linear"
              dataKey="temperature"
              name="Suhu Udara"
              stroke="#356a9a"
              strokeWidth={2.8}
              dot={false}
              activeDot={{ r: 5, fill: "#2b6cb0", stroke: "#ffffff", strokeWidth: 2 }}
              animationDuration={1200}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Subtle baseline note */}
      <div className="text-center pt-2">
        <span className="text-[11px] text-slate-400 font-medium">
          * Sumbu Y ditampilkan mulai dari batas 22,0°C sebagai acuan dasar klimatologis.
        </span>
      </div>
    </div>
  );
}
