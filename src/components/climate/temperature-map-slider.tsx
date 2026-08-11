"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface TemperatureMap {
  id: number;
  year: number;
  category: string;
  image_url: string;
  created_at: string;
}

interface TemperatureMapSliderProps {
  maps: TemperatureMap[];
}

export function TemperatureMapSlider({ maps }: TemperatureMapSliderProps) {
  const [filter, setFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Extract unique years for the filter dropdown
  const uniqueYears = useMemo(() => {
    const years = new Set(maps.map(m => m.year));
    return Array.from(years).sort((a, b) => b - a); // Descending
  }, [maps]);

  // Filter maps based on selection
  const filteredMaps = useMemo(() => {
    let filtered = maps;
    if (filter === "el_nino") {
      filtered = maps.filter(m => m.category === "El Niño");
    } else if (filter === "la_nina") {
      filtered = maps.filter(m => m.category === "La Niña");
    } else if (filter === "normal") {
      filtered = maps.filter(m => m.category === "Normal");
    } else if (filter !== "all") {
      // Must be a specific year
      filtered = maps.filter(m => m.year.toString() === filter);
    }
    
    // Reset index when filter changes
    setCurrentIndex(0);
    return filtered;
  }, [maps, filter]);

  const nextSlide = () => {
    if (currentIndex < filteredMaps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (maps.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm w-full max-w-2xl">
        <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          Filter Peta:
        </span>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="border border-border rounded-lg px-4 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">Semua Tahun & Kategori</option>
          <option value="normal">Normal</option>
          <option value="el_nino">El Niño</option>
          <option value="la_nina">La Niña</option>
          <optgroup label="Berdasarkan Tahun">
            {uniqueYears.map(year => (
              <option key={year} value={year.toString()}>Tahun {year}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Slider Container */}
      <div className="relative w-full overflow-hidden rounded-3xl bg-slate-50/50 border border-slate-100 p-2 md:p-6 shadow-inner">
        
        {filteredMaps.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            Peta tidak ditemukan untuk filter yang dipilih.
          </div>
        ) : (
          <div className="relative w-full">
            {/* The carousel track */}
            <div className="overflow-hidden rounded-xl">
              <motion.div 
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                animate={{ 
                  x: `calc(-${currentIndex} * (100% / var(--items-per-view, 1)))` 
                }}
                style={{
                  '--items-per-view': 1
                } as any}
              >
                {filteredMaps.map((map) => (
                  <div 
                    key={map.id} 
                    className="w-full md:w-1/2 flex-shrink-0 px-2 flex flex-col items-center"
                  >
                    <div className="relative w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group">
                      {/* Badge overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                        <span className="bg-white/95 backdrop-blur-md text-text-primary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border border-slate-100">
                          {map.year}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm text-white backdrop-blur-md ${map.category === 'El Niño' ? 'bg-error/95 border border-error' : map.category === 'La Niña' ? 'bg-primary/95 border border-primary' : 'bg-emerald-600/95 border border-emerald-600'}`}>
                          {map.category}
                        </span>
                      </div>
                      
                      {/* Image container: responsive height based on ratio, maxing out at a reasonable desktop size */}
                      <div className="w-full h-[50vh] md:h-[600px] flex items-center justify-center p-4 bg-slate-50/80 group-hover:bg-slate-100/80 transition-colors duration-500">
                        <img 
                          src={map.image_url} 
                          alt={`Peta Suhu ${map.year} - ${map.category}`}
                          className="max-w-full max-h-full object-contain drop-shadow-lg transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all z-20 text-primary ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-110 hover:shadow-xl'}`}
              aria-label="Previous slide"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>

            <button 
              onClick={nextSlide}
              disabled={currentIndex >= filteredMaps.length - 1}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all z-20 text-primary ${currentIndex >= filteredMaps.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-110 hover:shadow-xl'}`}
              aria-label="Next slide"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      {filteredMaps.length > 1 && (
        <div className="flex gap-2 items-center justify-center mt-2">
          {Array.from({ length: filteredMaps.length }).map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${currentIndex === i || (i === currentIndex + 1 && typeof window !== 'undefined' && window.innerWidth >= 768) ? 'w-6 bg-primary' : 'w-2 bg-slate-300'}`} 
            />
          ))}
        </div>
      )}

      {/* Global CSS to override CSS variable for responsive slider math */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .flex.transition-transform {
            --items-per-view: 2 !important;
          }
        }
      `}} />
    </div>
  );
}
