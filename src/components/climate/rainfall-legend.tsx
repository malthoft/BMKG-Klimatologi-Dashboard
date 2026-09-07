"use client";

import React from "react";

export function RainfallLegend() {
  const ticks = [
    { val: 1000, pos: 6.25 },
    { val: 1500, pos: 21.875 },
    { val: 2000, pos: 37.5 },
    { val: 2500, pos: 53.125 },
    { val: 3000, pos: 68.75 },
    { val: 3500, pos: 84.375 },
    { val: 4000, pos: 100 },
  ];

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-3">
      {/* Header / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">water_drop</span>
          </div>
          <span className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">
            Curah Hujan (mm/tahun)
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full w-fit">
          Legenda Skala Warna
        </span>
      </div>

      {/* Horizontal Gradient Bar & Ticks */}
      <div className="w-full pt-1">
        {/* The Bar */}
        <div
          className="relative w-full h-5 sm:h-6 rounded-full shadow-inner border border-slate-300/60 overflow-hidden"
          style={{
            background:
              "linear-gradient(to right, #800814 0%, #b8141e 6%, #d82727 12%, #eb5b25 21%, #f38531 29%, #f8b63e 37%, #eff586 46%, #b5dc5f 55%, #7dc252 64%, #2ea74d 73%, #117d47 82%, #045f44 91%, #083266 100%)",
          }}
        >
          {/* Subtle glossy sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/10 pointer-events-none" />
        </div>

        {/* Tick Notches and Value Labels */}
        <div className="relative w-full h-6 sm:h-7 mt-1.5">
          {ticks.map((t) => (
            <div
              key={t.val}
              className="absolute flex flex-col items-center"
              style={{
                left: `${t.pos}%`,
                transform:
                  t.pos === 100
                    ? "translateX(-100%)"
                    : t.pos <= 10
                    ? "translateX(-20%)"
                    : "translateX(-50%)",
              }}
            >
              {/* Vertical tick notch */}
              <div className="w-0.5 h-1.5 bg-slate-400 mb-0.5" />
              {/* Tick label */}
              <span className="text-[10px] sm:text-xs font-bold text-slate-700 select-none">
                {t.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Badges for Easy Interpretation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-start gap-2 bg-slate-50/80 px-2.5 py-2 rounded-lg border border-slate-100 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d82727] shrink-0 shadow-sm mt-0.5" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-slate-700 leading-tight">Rendah</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">&lt; 1500</span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-50/80 px-2.5 py-2 rounded-lg border border-slate-100 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f8b63e] shrink-0 shadow-sm mt-0.5" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-slate-700 leading-tight">Menengah</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">1500-2500</span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-50/80 px-2.5 py-2 rounded-lg border border-slate-100 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2ea74d] shrink-0 shadow-sm mt-0.5" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-slate-700 leading-tight">Tinggi</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">2500-3500</span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-50/80 px-2.5 py-2 rounded-lg border border-slate-100 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#083266] shrink-0 shadow-sm mt-0.5" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-slate-700 leading-tight">Sangat Tinggi</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">&gt; 3500</span>
          </div>
        </div>
      </div>
    </div>
  );
}
