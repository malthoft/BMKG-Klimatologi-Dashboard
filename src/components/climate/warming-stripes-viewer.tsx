"use client";

import { useState, useMemo, useEffect } from "react";
import { ClimateParsedResult, getColorForAnomaly } from "@/lib/climate-parser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WarmingStripesViewerProps {
  parsedData: ClimateParsedResult | null;
  className?: string;
}

export function WarmingStripesViewer({ parsedData, className = "" }: WarmingStripesViewerProps) {
  const regions = useMemo(() => {
    if (!parsedData || !parsedData.regionsData) return [];
    return Object.keys(parsedData.regionsData);
  }, [parsedData]);

  // Default region preferred: KOTA MALANG or KAB. MALANG or first available
  const initialRegion = useMemo(() => {
    if (regions.length === 0) return "";
    const malang = regions.find((r) => /malang/i.test(r));
    return malang || regions[0];
  }, [regions]);

  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion);
  const [stripeMode, setStripeMode] = useState<"discrete" | "smooth">("discrete");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialRegion && !selectedRegion) {
      setSelectedRegion(initialRegion);
    }
  }, [initialRegion, selectedRegion]);

  const hasData = Boolean(parsedData && regions.length > 0);

  const currentRegion =
    hasData && selectedRegion && parsedData!.regionsData[selectedRegion]
      ? selectedRegion
      : regions[0] || "";

  const regionInfo = hasData && currentRegion ? parsedData!.regionsData[currentRegion] : null;
  const years = hasData ? parsedData!.years : [];
  const anomalies = regionInfo ? regionInfo.anomalies : [];
  const baseline = regionInfo ? regionInfo.baseline : 0;

  // Calculate dynamic scale bound (zBound)
  const absMax = regionInfo
    ? Math.max(Math.abs(regionInfo.maxAnomaly), Math.abs(regionInfo.minAnomaly), 0.4)
    : 0.5;
  const zBound = Math.ceil(absMax * 10) / 10;

  // Dynamic CSS gradient for smooth mode (Hook called unconditionally)
  const smoothGradientString = useMemo(() => {
    if (anomalies.length === 0) return "";
    const step = 100 / (anomalies.length - 1 || 1);
    const stops = anomalies.map((val, idx) => {
      const color = getColorForAnomaly(val, zBound);
      return `${color} ${idx * step}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [anomalies, zBound]);

  if (!hasData || !regionInfo) {
    return (
      <div className="w-full p-8 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-surface-container-lowest">
        <span className="material-symbols-outlined text-4xl text-text-muted">show_chart</span>
        <h4 className="font-bold text-text-primary">Belum Ada Data Visualisasi</h4>
        <p className="text-sm text-text-secondary max-w-md">
          Data CSV anomali suhu belum diunggah atau tidak valid. Silakan unggah berkas CSV melalui mode Admin.
        </p>
      </div>
    );
  }

  // Active hover point (default to latest year)
  const activeIdx =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < years.length
      ? hoverIndex
      : years.length - 1;

  const activeYear = years[activeIdx];
  const activeAnomaly = anomalies[activeIdx];
  const activeActual = (baseline + activeAnomaly).toFixed(2);

  // Touch & Pointer interaction handler for mobile
  const handlePointerPos = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.floor(pct * years.length);
    setHoverIndex(Math.min(years.length - 1, Math.max(0, idx)));
  };

  return (
    <div className={`w-full flex flex-col gap-5 sm:gap-6 ${className}`}>
      {/* Top Controls Bar - Mobile Optimized */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">location_on</span>
            </div>
            <div className="flex-1 sm:hidden">
              <label htmlFor="regionSelectMobile" className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Pilih Wilayah ({regions.length} Lokasi)
              </label>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label htmlFor="regionSelect" className="text-xs font-semibold text-text-secondary uppercase tracking-wider hidden sm:block mb-1">
              Pilih Wilayah / Kabupaten / Kota ({regions.length} Lokasi)
            </label>
            <select
              id="regionSelect"
              value={currentRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 sm:py-2 font-bold text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Display Mode Toggle & Reset View */}
        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end w-full md:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border flex-1 sm:flex-initial justify-center">
            <button
              type="button"
              onClick={() => setStripeMode("discrete")}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                stripeMode === "discrete"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-black/5"
              }`}
            >
              Batang Per Tahun
            </button>
            <button
              type="button"
              onClick={() => setStripeMode("smooth")}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                stripeMode === "smooth"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-black/5"
              }`}
            >
              Gradient Smooth
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedRegion(initialRegion);
              setStripeMode("discrete");
              setHoverIndex(null);
            }}
            title="Reset Pilihan & Tampilan Grafik"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-surface-container-low text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Warming Stripes Visualization Box */}
      <Card className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 bg-white shadow-sm border border-border overflow-hidden">
        {/* Visual Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3 sm:pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-text-primary">Warming Stripes (Pita Pemanasan Iklim)</h3>
              <Badge variant="neutral" className="text-xs font-bold text-primary bg-primary/5 border-primary/20">
                {years[0]} - {years[years.length - 1]}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Sentuh atau geser jari Anda pada pita warna untuk melihat rincian anomali suhu tahunan di <strong>{currentRegion}</strong>.
            </p>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex md:hidden items-center justify-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/5 py-1.5 px-3 rounded-lg border border-primary/10">
          <span className="material-symbols-outlined text-sm animate-pulse">swipe</span>
          <span>Geser grafik ke samping untuk memperbesar tampilan pita</span>
        </div>

        {/* Warming Stripes Container with Horizontal Scroll on Small Screens */}
        <div className="relative w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          <div className="min-w-[620px] md:min-w-full relative py-2">
            {stripeMode === "discrete" ? (
              /* Discrete Yearly Bars */
              <div
                className="relative w-full h-[220px] sm:h-[240px] flex items-stretch rounded-xl overflow-hidden shadow-inner bg-surface cursor-crosshair border border-border select-none"
                onMouseLeave={() => setHoverIndex(null)}
                onTouchMove={(e) => {
                  if (e.touches.length > 0) {
                    handlePointerPos(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    handlePointerPos(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
                  }
                }}
              >
                {years.map((year, idx) => {
                  const anomaly = anomalies[idx];
                  const color = getColorForAnomaly(anomaly, zBound);
                  const isHovered = activeIdx === idx;
                  const isMaxYear = year === regionInfo.maxYear;
                  const isMinYear = year === regionInfo.minYear;

                  return (
                    <div
                      key={year}
                      onMouseEnter={() => setHoverIndex(idx)}
                      onClick={() => setHoverIndex(idx)}
                      className="relative flex-1 h-full transition-opacity group min-w-[12px] sm:min-w-0"
                      style={{ backgroundColor: color }}
                    >
                      {/* Hover Highlight Overlay */}
                      {isHovered && (
                        <div className="absolute inset-0 bg-white/35 border-x-2 border-white shadow-lg z-10 pointer-events-none" />
                      )}

                      {/* Peak Annotations - Touch & Mobile Friendly */}
                      {isMaxYear && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/95 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-md z-20 whitespace-nowrap pointer-events-none border border-white/20">
                          🔥 {year}
                        </div>
                      )}
                      {isMinYear && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-sky-600/95 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-md z-20 whitespace-nowrap pointer-events-none border border-white/20">
                          ❄️ {year}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Smooth Gradient View */
              <div
                className="relative w-full h-[220px] sm:h-[240px] rounded-xl overflow-hidden shadow-inner border border-border cursor-crosshair select-none"
                style={{ background: smoothGradientString }}
                onMouseMove={(e) => handlePointerPos(e.clientX, e.currentTarget.getBoundingClientRect())}
                onTouchMove={(e) => {
                  if (e.touches.length > 0) {
                    handlePointerPos(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    handlePointerPos(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Pointer indicator line for Smooth Mode */}
                {activeIdx !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md z-10 pointer-events-none"
                    style={{ left: `${((activeIdx + 0.5) / years.length) * 100}%` }}
                  />
                )}
              </div>
            )}

            {/* Timeline Axis Labels */}
            <div className="flex justify-between items-center text-[11px] font-bold text-text-secondary mt-2 px-1">
              <span>{years[0]}</span>
              <span>{years[Math.floor(years.length / 4)]}</span>
              <span>{years[Math.floor(years.length / 2)]}</span>
              <span>{years[Math.floor((years.length * 3) / 4)]}</span>
              <span>{years[years.length - 1]}</span>
            </div>
          </div>
        </div>

        {/* Color Bar Scale Legend */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <div className="flex items-center justify-between w-full max-w-md text-[10px] sm:text-[11px] font-bold text-text-secondary px-1">
            <span className="text-blue-600">Dingin ( -{zBound}°C )</span>
            <span>Netral ( 0°C )</span>
            <span className="text-red-600">Panas ( +{zBound}°C )</span>
          </div>
          <div
            className="w-full max-w-md h-3.5 rounded-full border border-border shadow-inner"
            style={{
              background:
                "linear-gradient(to right, #08306b 0%, #2b8cbe 18%, #7bccc4 36%, #f7f7f7 50%, #feb24c 64%, #f46d43 82%, #67000d 100%)",
            }}
          />
        </div>

        {/* Hover Detail Banner - Mobile Responsive */}
        <div className="bg-gradient-to-r from-surface-container-low to-surface border border-border rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0">
              {activeYear}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Detail Data Tahun {activeYear}
              </div>
              <div className="font-bold text-text-primary text-sm">{currentRegion}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex items-center sm:gap-6 border-t sm:border-t-0 border-border pt-2.5 sm:pt-0">
            <div className="bg-white/80 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-border/50 text-center sm:text-left">
              <div className="text-[10px] sm:text-[11px] font-medium text-text-secondary">Deviasi Anomali</div>
              <div className={`text-sm sm:text-base font-extrabold tabular-nums ${activeAnomaly >= 0 ? "text-red-600" : "text-blue-600"}`}>
                {activeAnomaly >= 0 ? "+" : ""}
                {activeAnomaly.toFixed(2)} °C
              </div>
            </div>

            <div className="bg-white/80 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-border/50 text-center sm:text-left">
              <div className="text-[10px] sm:text-[11px] font-medium text-text-secondary">Estimasi Suhu Aktual</div>
              <div className="text-sm sm:text-base font-extrabold text-text-primary tabular-nums">
                {activeActual} °C
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Cards - Grid 2-col on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-1">
          {/* KPI 1 */}
          <div className="bg-surface p-3.5 sm:p-4 rounded-xl border border-border flex flex-col justify-between gap-1.5 hover:shadow-md transition-shadow">
            <span className="text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">Karakteristik Data</span>
            <div className="font-extrabold text-xs sm:text-base text-emerald-600 truncate">{regionInfo.type}</div>
            <span className="text-[10px] sm:text-xs text-text-secondary line-clamp-1">{regionInfo.desc}</span>
          </div>

          {/* KPI 2 */}
          <div className="bg-surface p-3.5 sm:p-4 rounded-xl border border-border flex flex-col justify-between gap-1.5 hover:shadow-md transition-shadow">
            <span className="text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">Baseline Suhu Normal</span>
            <div className="font-extrabold text-base sm:text-xl text-sky-600 tabular-nums">{baseline.toFixed(2)} °C</div>
            <span className="text-[10px] sm:text-xs text-text-secondary">Rata-rata Periode</span>
          </div>

          {/* KPI 3 */}
          <div className="bg-surface p-3.5 sm:p-4 rounded-xl border border-border flex flex-col justify-between gap-1.5 hover:shadow-md transition-shadow">
            <span className="text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">Laju Pemanasan</span>
            <div className={`font-extrabold text-base sm:text-xl tabular-nums ${regionInfo.rate >= 0 ? "text-rose-600" : "text-blue-600"}`}>
              {regionInfo.rate >= 0 ? "+" : ""}
              {regionInfo.rate.toFixed(3)} °C
            </div>
            <span className="text-[10px] sm:text-xs text-text-secondary">Per Dekade (10 thn)</span>
          </div>

          {/* KPI 4 */}
          <div className="bg-surface p-3.5 sm:p-4 rounded-xl border border-border flex flex-col justify-between gap-1.5 hover:shadow-md transition-shadow">
            <span className="text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">Anomali Tertinggi</span>
            <div className="font-extrabold text-base sm:text-xl text-amber-600 tabular-nums">
              +{regionInfo.maxAnomaly.toFixed(2)} °C
            </div>
            <span className="text-[10px] sm:text-xs text-text-secondary truncate">
              Puncak: Tahun {regionInfo.maxYear}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
