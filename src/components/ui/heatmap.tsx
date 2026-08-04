"use client";

import { useState, useEffect } from "react";

export function Heatmap() {
  const [cells, setCells] = useState<number[]>([]);

  useEffect(() => {
    // Generate 48 cells (12 cols x 4 rows)
    const newCells = Array.from({ length: 48 }, () => Math.floor(Math.random() * 5));
    setCells(newCells);
  }, []);

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-[#f3f4f6]";
      case 1: return "bg-[#dbeafe]";
      case 2: return "bg-[#93c5fd]";
      case 3: return "bg-[#3b82f6]";
      case 4: return "bg-[#1d4ed8]";
      default: return "bg-[#f3f4f6]";
    }
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-1 w-full">
        {cells.map((intensity, idx) => (
          <div
            key={idx}
            title={`Intensitas: ${intensity}`}
            className={`w-full aspect-square rounded-[2px] transition-transform hover:scale-110 cursor-pointer ${getHeatmapColor(intensity)}`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center mt-4 text-xs text-text-secondary">
        <span>Rendah</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-[#f3f4f6] rounded-sm"></div>
          <div className="w-3 h-3 bg-[#dbeafe] rounded-sm"></div>
          <div className="w-3 h-3 bg-[#93c5fd] rounded-sm"></div>
          <div className="w-3 h-3 bg-[#3b82f6] rounded-sm"></div>
          <div className="w-3 h-3 bg-[#1d4ed8] rounded-sm"></div>
        </div>
        <span>Tinggi</span>
      </div>
    </div>
  );
}
